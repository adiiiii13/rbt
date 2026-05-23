import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'
import Razorpay from 'razorpay'
import crypto from 'crypto'

initializeApp()
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 })

const auth = getAuth()
const db = getFirestore()

// Razorpay keys — set in functions/.env file
const razorpayKeyId = process.env.RAZORPAY_KEY_ID
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

function assertAdmin(ctxAuth) {
  if (!ctxAuth) throw new HttpsError('unauthenticated', 'Sign in required')
  const isAdminClaim = ctxAuth.token.role === 'admin'
  const isAdminEmail = ctxAuth.token.email && ctxAuth.token.email.endsWith('@rbtmission.com')
  if (!isAdminClaim && !isAdminEmail) throw new HttpsError('permission-denied', 'Admin only')
}

function assertAuthenticated(ctxAuth) {
  if (!ctxAuth) throw new HttpsError('unauthenticated', 'Sign in required')
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

// Update student account: Firebase Auth user + Firestore profile
export const updateStudent = onCall(async (request) => {
  assertAdmin(request.auth)
  const { uid, studentId, name, email, phone, course, password } = request.data || {}
  if (!uid || !studentId || !name) {
    throw new HttpsError('invalid-argument', 'uid, studentId, name required')
  }
  const loginEmail = email || `${String(studentId).toLowerCase()}@students.rbtmission.com`
  
  const updateData = {
    email: loginEmail,
    displayName: name,
  }
  if (password && password.length >= 8) {
    updateData.password = password
  }
  
  await auth.updateUser(uid, updateData)
  
  await db.collection('students').doc(uid).update({
    studentId,
    name,
    email: loginEmail,
    phone: phone || null,
    course: course || null,
  })
  
  return { ok: true }
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

// Trigger: new counselling booking → FCM push to admins
export const onCounsellingCreated = onDocumentCreated('counsellingBookings/{id}', async (event) => {
  const data = event.data?.data()
  if (!data) return

  // Read all students who have fcmToken to push to admins (we store admin tokens in a doc)
  const tokens = []
  try {
    const adminDoc = await db.doc('_meta/adminTokens').get()
    if (adminDoc.exists && adminDoc.data().tokens) {
      tokens.push(...adminDoc.data().tokens)
    }
  } catch {}

  if (tokens.length === 0) return

  await getMessaging().sendEachForMulticast({
    notification: {
      title: 'New Counselling Booking',
      body: `${data.studentName}: ${data.topic} on ${data.preferredDate}`,
    },
    tokens,
  })
})

// Trigger: new contact inquiry → FCM push to admins
export const onContactCreated = onDocumentCreated('inquiries/{id}', async (event) => {
  const data = event.data?.data()
  if (!data) return

  const tokens = []
  try {
    const adminDoc = await db.doc('_meta/adminTokens').get()
    if (adminDoc.exists && adminDoc.data().tokens) {
      tokens.push(...adminDoc.data().tokens)
    }
  } catch {}

  if (tokens.length === 0) return

  await getMessaging().sendEachForMulticast({
    notification: {
      title: 'New Contact Inquiry',
      body: `${data.name}: ${(data.message || '').substring(0, 80)}`,
    },
    tokens,
  })
})

export const initializeStudentAccount = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required')
  
  if (request.auth.token.role) return { ok: true, role: request.auth.token.role }

  const uid = request.auth.uid;
  const userRecord = await auth.getUser(uid);
  
  const allowedDomains = ['students.rbtmission.com', 'rbtmission.com'];
  const emailDomain = userRecord.email ? userRecord.email.split('@')[1].toLowerCase() : '';
  
  if (!allowedDomains.includes(emailDomain)) {
    throw new HttpsError('permission-denied', 'Email domain not authorized for student account');
  }
  
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
    });
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

// ─── Razorpay Payment Gateway ───────────────────────────────────────────────

// Create a Razorpay order (server-side) — called before opening checkout
export const createRazorpayOrder = onCall(async (request) => {
    assertAuthenticated(request.auth)

    const { amount, courseId, courseTitle, variantLabel } = request.data || {}
    if (!amount || !courseId) {
      throw new HttpsError('invalid-argument', 'amount and courseId required')
    }
    if (amount < 1) {
      throw new HttpsError('invalid-argument', 'Amount must be at least ₹1')
    }

    const rzp = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    let order
    try {
      order = await rzp.orders.create({
        amount: Math.round(amount * 100), // convert to paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          courseId,
          courseTitle: courseTitle || '',
          variantLabel: variantLabel || '',
          uid: request.auth.uid,
        },
      })
    } catch (err) {
      console.error('Razorpay order creation failed:', err)
      throw new HttpsError('internal', 'Failed to create payment order')
    }

    // Store pending order in Firestore
    await db.collection('razorpayOrders').doc(order.id).set({
      orderId: order.id,
      uid: request.auth.uid,
      courseId,
      courseTitle: courseTitle || '',
      variantLabel: variantLabel || '',
      amount,
      amountPaise: order.amount,
      currency: order.currency,
      status: 'created',
      createdAt: FieldValue.serverTimestamp(),
    })

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: razorpayKeyId,
    }
  }
)

// Verify Razorpay payment signature + create enrollment
export const verifyRazorpayPayment = onCall(async (request) => {
    assertAuthenticated(request.auth)

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
      variantMonths,
      variantPrice,
      courseTitle,
    } = request.data || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpsError('invalid-argument', 'Missing payment verification fields')
    }

    // 1. Verify HMAC signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      // Mark order as failed
      await db.collection('razorpayOrders').doc(razorpay_order_id).update({
        status: 'signature_mismatch',
        failedAt: FieldValue.serverTimestamp(),
      })
      throw new HttpsError('permission-denied', 'Payment verification failed — signature mismatch')
    }

    // 2. Mark order as paid
    await db.collection('razorpayOrders').doc(razorpay_order_id).update({
      status: 'paid',
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paidAt: FieldValue.serverTimestamp(),
    })

    // 3. Create enrollment
    const uid = request.auth.uid
    const studentDoc = await db.collection('students').doc(uid).get()
    const studentData = studentDoc.exists ? studentDoc.data() : {}

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + (variantMonths || 6))

    const enrollmentData = {
      uid,
      courseId: courseId || '',
      courseTitle: courseTitle || '',
      variant: {
        months: variantMonths || 6,
        price: variantPrice || 0,
      },
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: variantPrice || 0,
      enrolledAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
      studentName: studentData.name || 'Student',
      studentEmail: studentData.email || '',
    }

    const enrollRef = await db.collection('enrollments').add(enrollmentData)

    // 4. Also record payment in the payments collection for admin tracking
    await db.collection('payments').add({
      type: 'razorpay',
      studentId: studentData.studentId || uid,
      studentName: studentData.name || 'Student',
      studentEmail: studentData.email || '',
      courseId: courseId || '',
      courseTitle: courseTitle || '',
      amount: variantPrice || 0,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'paid',
      paidAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    })

    return { success: true, enrollmentId: enrollRef.id }
  }
)

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

// Razorpay Webhook to catch async payment events
export const razorpayWebhook = onRequest(async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature']
    if (!signature) {
      res.status(400).send('Missing signature')
      return
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(JSON.stringify(req.body))
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('Invalid signature')
      res.status(400).send('Invalid signature')
      return
    }

    const event = req.body.event
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const paymentEntity = req.body.payload.payment.entity
      const orderId = paymentEntity.order_id
      const paymentId = paymentEntity.id
      const notes = paymentEntity.notes || {}

      if (!orderId) {
        res.status(200).send('No order ID associated')
        return
      }

      // Check if order already processed by client app
      const orderRef = db.collection('razorpayOrders').doc(orderId)
      const orderDoc = await orderRef.get()

      if (orderDoc.exists && orderDoc.data().status === 'paid') {
        // Already handled by frontend verification
        res.status(200).send('Already processed')
        return
      }

      // Fulfill the order
      await orderRef.update({
        status: 'paid',
        paymentId: paymentId,
        signature: 'webhook_verified',
        paidAt: FieldValue.serverTimestamp(),
      })

      const uid = notes.uid
      const courseId = notes.courseId
      const amount = paymentEntity.amount / 100 // paise to rupees

      if (uid && courseId) {
        const studentDoc = await db.collection('students').doc(uid).get()
        const studentData = studentDoc.exists ? studentDoc.data() : {}

        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 6) // default 6 months if not passed in notes

        await db.collection('enrollments').add({
          uid,
          courseId,
          courseTitle: notes.courseTitle || '',
          variant: { months: 6, price: amount },
          paymentId,
          orderId,
          amount,
          enrolledAt: FieldValue.serverTimestamp(),
          expiresAt: expiresAt.toISOString(),
          studentName: studentData.name || 'Student',
          studentEmail: studentData.email || '',
        })

        await db.collection('payments').add({
          type: 'razorpay_webhook',
          studentId: studentData.studentId || uid,
          studentName: studentData.name || 'Student',
          studentEmail: studentData.email || '',
          courseId: courseId,
          courseTitle: notes.courseTitle || '',
          amount: amount,
          paymentId: paymentId,
          orderId: orderId,
          status: 'paid',
          paidAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        })
      }
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).send('Internal Error')
  }
})
