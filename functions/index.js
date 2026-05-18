import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'

initializeApp()
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 })

const auth = getAuth()
const db = getFirestore()

function assertAdmin(ctxAuth) {
  if (!ctxAuth) throw new HttpsError('unauthenticated', 'Sign in required')
  if (ctxAuth.token.role !== 'admin') throw new HttpsError('permission-denied', 'Admin only')
}

// Admin bootstrap: one-time elevate the first admin manually via Firebase Console,
// then use this callable to grant admin claim to others.
export const grantAdminRole = onCall(async (request) => {
  assertAdmin(request.auth)
  const { uid } = request.data || {}
  if (!uid) throw new HttpsError('invalid-argument', 'uid required')
  await auth.setCustomUserClaims(uid, { role: 'admin' })
  return { ok: true }
})

// Create a new student account: Firebase Auth user + Firestore profile + claim
export const createStudent = onCall(async (request) => {
  assertAdmin(request.auth)
  const { studentId, name, email, phone, course, password } = request.data || {}
  if (!studentId || !name || !password) {
    throw new HttpsError('invalid-argument', 'studentId, name, password required')
  }
  const loginEmail = email || `${String(studentId).toLowerCase()}@students.rbtmission.com`
  if (password.length < 8) throw new HttpsError('invalid-argument', 'Password >= 8 chars')

  const userRecord = await auth.createUser({
    email: loginEmail,
    password,
    displayName: name,
    disabled: false,
  })
  await auth.setCustomUserClaims(userRecord.uid, { role: 'student' })
  await db.collection('students').doc(userRecord.uid).set({
    studentId,
    name,
    email: loginEmail,
    phone: phone || null,
    course: course || null,
    role: 'student',
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
  })
  return { ok: true, uid: userRecord.uid }
})

export const disableStudent = onCall(async (request) => {
  assertAdmin(request.auth)
  const { uid, disabled } = request.data || {}
  if (!uid) throw new HttpsError('invalid-argument', 'uid required')
  await auth.updateUser(uid, { disabled: !!disabled })
  await db.collection('students').doc(uid).update({ status: disabled ? 'disabled' : 'active' })
  return { ok: true }
})

export const deleteStudent = onCall(async (request) => {
  assertAdmin(request.auth)
  const { uid } = request.data || {}
  if (!uid) throw new HttpsError('invalid-argument', 'uid required')
  await auth.deleteUser(uid)
  await db.collection('students').doc(uid).delete()
  return { ok: true }
})

// Trigger: when counselling/contact docs created, notify admins (placeholder — wire email later)
export const onCounsellingCreated = onDocumentCreated('counselling/{id}', async (event) => {
  const data = event.data?.data()
  if (!data) return
  await db.collection('adminNotifications').add({
    type: 'counselling',
    refId: event.params.id,
    name: data.name,
    createdAt: FieldValue.serverTimestamp(),
    read: false,
  })
})

export const onContactCreated = onDocumentCreated('contacts/{id}', async (event) => {
  const data = event.data?.data()
  if (!data) return
  await db.collection('adminNotifications').add({
    type: 'contact',
    refId: event.params.id,
    name: data.name,
    createdAt: FieldValue.serverTimestamp(),
    read: false,
  })
})

export const initializeStudentAccount = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required')
  
  if (request.auth.token.role) return { ok: true, role: request.auth.token.role }

  const uid = request.auth.uid;
  const userRecord = await auth.getUser(uid);
  
  await auth.setCustomUserClaims(uid, { role: 'student' })
  
  const docRef = db.collection('students').doc(uid);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    await docRef.set({
      studentId: `G-${uid.substring(0, 6).toUpperCase()}`,
      name: userRecord.displayName || 'Google Student',
      email: userRecord.email,
      phone: userRecord.phoneNumber || null,
      course: 'Pending',
      role: 'student',
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    })
  }
  return { ok: true, role: 'student' }
})

export const onNoticeCreated = onDocumentCreated('notices/{id}', async (event) => {
  const notice = event.data?.data();
  if (!notice) return;

  const studentsSnap = await db.collection('students').where('status', '==', 'active').get();
  const tokens = [];
  
  studentsSnap.forEach(doc => {
    const data = doc.data();
    if (data.fcmToken) {
      tokens.push(data.fcmToken);
    }
  });

  if (tokens.length === 0) return;

  const message = {
    notification: {
      title: 'New Notice: ' + notice.title,
      body: notice.content ? notice.content.substring(0, 100) + '...' : 'Check out the new notice in your portal.',
    },
    tokens: tokens,
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    console.log(response.successCount + ' messages were sent successfully');
  } catch (error) {
    console.error('Error sending messages:', error);
  }
});

// Architecture Placeholder: Video Transcoder Webhook
// This listens to raw video uploads in Firebase Storage and would trigger Google Cloud Transcoder.
// export const onVideoUploaded = onDocumentCreated('videos/{id}', async (event) => {
//   const videoDoc = event.data?.data();
//   if (videoDoc?.rawUrl && !videoDoc?.hlsUrl) {
//       // 1. Call GCP Video Transcoder API
//       // 2. Convert MP4 to .m3u8 chunks in a private bucket
//       // 3. Update Firestore doc with the new HLS URL:
//       // await db.collection('videos').doc(event.params.id).update({
//       //   videoUrl: 'https://storage.googleapis.com/.../output.m3u8',
//       //   status: 'ready'
//       // })
//   }
// });
