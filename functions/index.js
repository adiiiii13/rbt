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

// ─── Email Helpers ────────────────────────────────────────────────────────

async function sendReceiptEmail(toEmail, toName, amount, itemName, dateStr, orderId) {
  if (!toEmail) return;
  try {
    await db.collection('mail').add({
      to: toEmail,
      message: {
        subject: `Payment Receipt: ${itemName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #22c55e;">Payment Successful!</h2>
            <p>Hi ${toName},</p>
            <p>Thank you for your purchase. We have received your payment.</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Item:</strong> ${itemName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Amount Paid:</strong> ₹${amount}</p>
              <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
              <p style="margin: 0;"><strong>Order ID:</strong> ${orderId}</p>
            </div>
            <p>You can now access your content by logging into your account.</p>
            <p>If you have any questions, please contact our support team.</p>
            <br/>
            <p>Best regards,<br/><strong>RBT Mission Team</strong></p>
          </div>
        `
      }
    });
  } catch (err) {
    console.error('Error sending receipt email:', err);
  }
}

const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'rbtmissionlearning@gmail.com'

async function sendAdminPaymentAlert({ studentName, studentEmail, amount, itemName, paymentId, orderId, method, invoiceNumber }) {
  try {
    await db.collection('mail').add({
      to: ADMIN_NOTIFY_EMAIL,
      message: {
        subject: `New Payment: ${itemName} — ₹${amount} from ${studentName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #2563eb;">New Payment Received</h2>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${studentEmail || '—'}</p>
              <p style="margin: 0 0 8px 0;"><strong>Item:</strong> ${itemName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ₹${amount}</p>
              <p style="margin: 0 0 8px 0;"><strong>Method:</strong> ${method || 'Razorpay'}</p>
              <p style="margin: 0 0 8px 0;"><strong>Invoice #:</strong> ${invoiceNumber || '—'}</p>
              <p style="margin: 0 0 8px 0;"><strong>Payment ID:</strong> ${paymentId || '—'}</p>
              <p style="margin: 0;"><strong>Order ID:</strong> ${orderId || '—'}</p>
            </div>
            <p>Open admin panel to view full details.</p>
          </div>
        `
      }
    })
    // also drop an adminAlerts doc for in-app admin notify center
    await db.collection('adminAlerts').add({
      type: 'payment',
      studentName,
      studentEmail: studentEmail || '',
      itemName,
      amount,
      method: method || 'razorpay',
      invoiceNumber: invoiceNumber || '',
      paymentId: paymentId || '',
      orderId: orderId || '',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error('Error sending admin payment alert:', err)
  }
}

function buildInvoiceNumber(seed) {
  const s = String(seed || Date.now()).replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()
  return `RBT-INV-${s}`
}

async function sendWelcomeEmail(toEmail, toName) {
  if (!toEmail) return;
  try {
    await db.collection('mail').add({
      to: toEmail,
      message: {
        subject: `Welcome to RBT Mission!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #22c55e;">Welcome aboard, ${toName}!</h2>
            <p>We're thrilled to have you join RBT Mission.</p>
            <p>Your account has been successfully created. You can now log in to your portal to complete your profile, explore our courses, and track your progress.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://students.rbtmission.com" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Student Portal</a>
            </div>
            <p>If you have any questions, our support team is always here to help.</p>
            <br/>
            <p>Best regards,<br/><strong>RBT Mission Team</strong></p>
          </div>
        `
      }
    });
  } catch (err) {
    console.error('Error sending welcome email:', err);
  }
}

// ─── User Management ────────────────────────────────────────────────────────

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

  try {
    // 1. Fetch student data to get studentId
    const studentSnap = await db.collection('students').doc(uid).get()
    const studentData = studentSnap.data()
    const studentId = studentData?.studentId

    // 2. Delete related records in batches
    // We'll execute them separately since a batch has a 500 operation limit, 
    // though a single student unlikely to exceed this, it's safer.
    const collectionsToDelete = [
      { name: 'enrollments', field: 'uid', value: uid },
      { name: 'razorpayOrders', field: 'uid', value: uid },
      { name: 'mockResults', field: 'uid', value: uid },
      { name: 'payments', field: 'studentId', value: uid }
    ]

    for (const coll of collectionsToDelete) {
      const snap = await db.collection(coll.name).where(coll.field, '==', coll.value).get()
      const batch = db.batch()
      snap.forEach(doc => batch.delete(doc.ref))
      await batch.commit()
    }

    // Also check payments with string studentId if different from uid
    if (studentId && studentId !== uid) {
      const snap = await db.collection('payments').where('studentId', '==', studentId).get()
      const batch = db.batch()
      snap.forEach(doc => batch.delete(doc.ref))
      await batch.commit()
    }

    // 3. Delete student document
    await db.collection('students').doc(uid).delete()

    // 4. Delete user from Firebase Authentication
    try {
      await auth.deleteUser(uid)
    } catch (authErr) {
      console.warn(`Auth user ${uid} might already be deleted:`, authErr.message)
    }

    // 5. Delete associated storage files (if any exist under students/{uid}/)
    try {
      const { getStorage } = await import('firebase-admin/storage')
      const bucket = getStorage().bucket()
      await bucket.deleteFiles({ prefix: `students/${uid}/` })
    } catch (storageErr) {
      console.warn(`Could not delete storage for ${uid}:`, storageErr.message)
    }

    return { ok: true }
  } catch (err) {
    console.error('Error deleting student completely:', err)
    throw new HttpsError('internal', 'Failed to fully delete student.')
  }
})

// Bulk delete students (server-side, chunked parallel processing)
export const bulkDeleteStudents = onCall(async (request) => {
  assertAdmin(request.auth)
  const { uids } = request.data || {}
  if (!uids || !Array.isArray(uids)) {
    throw new HttpsError('invalid-argument', 'uids array required')
  }

  const results = { success: 0, failed: 0, errors: [] }

  // Process in chunks of 10 to avoid hitting limits but remain fast
  const chunkSize = 10;
  for (let i = 0; i < uids.length; i += chunkSize) {
    const chunk = uids.slice(i, i + chunkSize);
    
    await Promise.allSettled(chunk.map(async (uid) => {
      try {
        const studentSnap = await db.collection('students').doc(uid).get()
        const studentData = studentSnap.exists ? studentSnap.data() : {}
        const studentId = studentData?.studentId

        const collectionsToDelete = [
          { name: 'enrollments', field: 'uid', value: uid },
          { name: 'razorpayOrders', field: 'uid', value: uid },
          { name: 'mockResults', field: 'uid', value: uid },
          { name: 'payments', field: 'studentId', value: uid }
        ]

        for (const coll of collectionsToDelete) {
          const snap = await db.collection(coll.name).where(coll.field, '==', coll.value).get()
          const batch = db.batch()
          snap.forEach(doc => batch.delete(doc.ref))
          await batch.commit()
        }

        if (studentId && studentId !== uid) {
          const snap = await db.collection('payments').where('studentId', '==', studentId).get()
          const batch = db.batch()
          snap.forEach(doc => batch.delete(doc.ref))
          await batch.commit()
        }

        await db.collection('students').doc(uid).delete()

        try {
          await auth.deleteUser(uid)
        } catch (authErr) {
          console.warn(`Auth user ${uid} might already be deleted:`, authErr.message)
        }

        try {
          const { getStorage } = await import('firebase-admin/storage')
          const bucket = getStorage().bucket()
          await bucket.deleteFiles({ prefix: `students/${uid}/` })
        } catch (storageErr) {
          console.warn(`Could not delete storage for ${uid}:`, storageErr.message)
        }

        results.success++;
      } catch (err) {
        console.error(`Error deleting student ${uid}:`, err)
        results.failed++;
        results.errors.push({ uid, error: err.message });
      }
    }));
  }

  return results;
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

// Trigger: new student created → Welcome Email
export const onStudentCreated = onDocumentCreated('students/{id}', async (event) => {
  const data = event.data?.data();
  if (!data || !data.email) return;

  await sendWelcomeEmail(data.email, data.name || 'Student');
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
      studentUid: uid,
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

    // 5. Create paid invoice record so student sees it in My Invoices
    const invoiceNumber = buildInvoiceNumber(enrollRef.id)
    const paidDateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    await db.collection('invoices').add({
      invoiceNumber,
      studentUid: uid,
      studentName: studentData.name || 'Student',
      studentEmail: studentData.email || '',
      courseName: courseTitle || 'Course',
      description: `${variantMonths || 6}-month plan`,
      amount: variantPrice || 0,
      status: 'paid',
      paidAt: paidDateStr,
      issuedDate: paidDateStr,
      method: 'razorpay',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      enrollmentId: enrollRef.id,
      createdAt: FieldValue.serverTimestamp(),
    })

    // 6. Notify student in-app
    await db.collection('notifications').add({
      studentUid: uid,
      studentName: studentData.name || 'Student',
      subject: `Payment confirmed: ${courseTitle || 'Course'}`,
      message: `Payment of ₹${variantPrice || 0} received. Invoice ${invoiceNumber}. Access unlocked.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })

    // 7. Send receipt email to student
    await sendReceiptEmail(
      studentData.email || '',
      studentData.name || 'Student',
      variantPrice || 0,
      courseTitle || 'Course',
      new Date().toLocaleString('en-IN'),
      razorpay_order_id
    )

    // 8. Admin alert (email + adminAlerts doc)
    await sendAdminPaymentAlert({
      studentName: studentData.name || 'Student',
      studentEmail: studentData.email || '',
      amount: variantPrice || 0,
      itemName: courseTitle || 'Course',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      method: 'Razorpay',
      invoiceNumber,
    })

    return { success: true, enrollmentId: enrollRef.id, invoiceNumber }
  }
)

// ─── Razorpay Invoice Payment ───────────────────────────────────────────────

export const createInvoiceRazorpayOrder = onCall(async (request) => {
  assertAuthenticated(request.auth)
  const { invoiceId } = request.data || {}
  if (!invoiceId) throw new HttpsError('invalid-argument', 'invoiceId required')

  const invoiceDoc = await db.collection('invoices').doc(invoiceId).get()
  if (!invoiceDoc.exists) throw new HttpsError('not-found', 'Invoice not found')
  const invoice = invoiceDoc.data()

  if (invoice.status === 'paid' || invoice.status === 'verified') {
    throw new HttpsError('failed-precondition', 'Invoice already paid')
  }

  const rzp = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
  let order
  try {
    order = await rzp.orders.create({
      amount: Math.round(invoice.amount * 100),
      currency: 'INR',
      receipt: `inv_${invoiceId}_${Date.now()}`.slice(0, 40),
      notes: {
        type: 'invoice',
        invoiceId,
        uid: request.auth.uid,
        courseTitle: invoice.courseName || '',
      },
    })
  } catch (err) {
    console.error('Razorpay invoice order creation failed:', err)
    throw new HttpsError('internal', 'Failed to create invoice payment order')
  }

  await db.collection('razorpayOrders').doc(order.id).set({
    orderId: order.id,
    uid: request.auth.uid,
    type: 'invoice',
    invoiceId,
    amount: invoice.amount,
    amountPaise: order.amount,
    currency: order.currency,
    status: 'created',
    createdAt: FieldValue.serverTimestamp(),
  })

  return { orderId: order.id, amount: order.amount, currency: order.currency, key: razorpayKeyId, invoice }
})

export const verifyInvoiceRazorpayPayment = onCall(async (request) => {
  assertAuthenticated(request.auth)
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    invoiceId,
  } = request.data || {}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
    throw new HttpsError('invalid-argument', 'Missing payment verification fields')
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    await db.collection('razorpayOrders').doc(razorpay_order_id).update({
      status: 'signature_mismatch',
      failedAt: FieldValue.serverTimestamp(),
    })
    throw new HttpsError('permission-denied', 'Payment verification failed — signature mismatch')
  }

  const uid = request.auth.uid

  await db.collection('razorpayOrders').doc(razorpay_order_id).update({
    status: 'paid',
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    paidAt: FieldValue.serverTimestamp(),
  })

  const invoiceDoc = await db.collection('invoices').doc(invoiceId).get()
  const invoice = invoiceDoc.exists ? invoiceDoc.data() : null

  if (invoice && invoice.status !== 'paid' && invoice.status !== 'verified') {
    await db.collection('invoices').doc(invoiceId).update({
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentId: razorpay_payment_id
    })

    const studentDoc = await db.collection('students').doc(uid).get()
    const studentData = studentDoc.exists ? studentDoc.data() : {}

    await db.collection('payments').add({
      type: 'razorpay_invoice',
      studentId: studentData.studentId || uid,
      studentUid: uid,
      studentName: studentData.name || invoice.studentName || 'Student',
      studentEmail: studentData.email || invoice.studentEmail || '',
      invoiceNumber: invoice.invoiceNumber || '',
      courseTitle: invoice.courseName || '',
      amount: invoice.amount || 0,
      method: 'razorpay',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'verified',
      paidAt: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp()
    })

    // SEND RECEIPT EMAIL
    await sendReceiptEmail(
      studentData.email || invoice.studentEmail || '',
      studentData.name || invoice.studentName || 'Student',
      invoice.amount || 0,
      invoice.courseName || 'Invoice Payment',
      new Date().toLocaleString('en-IN'),
      razorpay_order_id
    )

    // Notify student
    await db.collection('notifications').add({
      studentUid: uid,
      studentName: studentData.name || invoice.studentName || 'Student',
      subject: `Invoice paid: ${invoice.invoiceNumber || ''}`,
      message: `Payment of ₹${invoice.amount || 0} confirmed for ${invoice.courseName || 'invoice'}.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })

    // Admin alert
    await sendAdminPaymentAlert({
      studentName: studentData.name || invoice.studentName || 'Student',
      studentEmail: studentData.email || invoice.studentEmail || '',
      amount: invoice.amount || 0,
      itemName: invoice.courseName || 'Invoice Payment',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      method: 'Razorpay',
      invoiceNumber: invoice.invoiceNumber || '',
    })
  }

  return { success: true }
})

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

// Trigger: free enrollment (amount === 0) → receipt + admin alert
export const onEnrollmentCreated = onDocumentCreated('enrollments/{id}', async (event) => {
  const data = event.data?.data()
  if (!data) return
  // Only handle free enrollments here; paid Razorpay path already emails inline
  if ((data.amount || 0) > 0) return
  if (data.notifiedAt) return

  try {
    const itemName = data.courseName || data.courseTitle || 'Course'
    const dateStr = new Date().toLocaleString('en-IN')
    const orderId = `FREE-${event.params.id}`

    await sendReceiptEmail(
      data.studentEmail || '',
      data.studentName || 'Student',
      0,
      `${itemName} (Free)`,
      dateStr,
      orderId
    )

    // Pull invoice number if invoice doc exists
    let invoiceNumber = ''
    try {
      const invSnap = await db.collection('invoices').where('enrollmentId', '==', event.params.id).limit(1).get()
      if (!invSnap.empty) invoiceNumber = invSnap.docs[0].data().invoiceNumber || ''
    } catch {}

    await sendAdminPaymentAlert({
      studentName: data.studentName || 'Student',
      studentEmail: data.studentEmail || '',
      amount: 0,
      itemName: `${itemName} (Free)`,
      paymentId: '',
      orderId,
      method: 'Free Enrollment',
      invoiceNumber,
    })

    await event.data.ref.update({ notifiedAt: FieldValue.serverTimestamp() })
  } catch (err) {
    console.error('onEnrollmentCreated error:', err)
  }
})

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
      const type = notes.type
      const amount = paymentEntity.amount / 100 // paise to rupees

      if (type === 'invoice') {
        const invoiceId = notes.invoiceId
        if (invoiceId) {
          const invoiceDoc = await db.collection('invoices').doc(invoiceId).get()
          const invoice = invoiceDoc.exists ? invoiceDoc.data() : null
          if (invoice && invoice.status !== 'paid' && invoice.status !== 'verified') {
            await db.collection('invoices').doc(invoiceId).update({
              status: 'paid',
              paidAt: new Date().toISOString(),
              paymentId: paymentId
            })
            const studentDoc = await db.collection('students').doc(uid).get()
            const studentData = studentDoc.exists ? studentDoc.data() : {}
            await db.collection('payments').add({
              type: 'razorpay_invoice_webhook',
              studentId: studentData.studentId || uid,
              studentUid: uid,
              studentName: studentData.name || invoice.studentName || 'Student',
              studentEmail: studentData.email || invoice.studentEmail || '',
              invoiceNumber: invoice.invoiceNumber || '',
              courseTitle: invoice.courseName || '',
              amount: invoice.amount || 0,
              method: 'razorpay',
              paymentId: paymentId,
              orderId: orderId,
              status: 'verified',
              paidAt: new Date().toISOString(),
              createdAt: FieldValue.serverTimestamp()
            })

            // SEND RECEIPT EMAIL
            await sendReceiptEmail(
              studentData.email || invoice.studentEmail || '',
              studentData.name || invoice.studentName || 'Student',
              invoice.amount || 0,
              invoice.courseName || 'Invoice Payment',
              new Date().toLocaleString('en-IN'),
              orderId
            )

            await db.collection('notifications').add({
              studentUid: uid,
              studentName: studentData.name || invoice.studentName || 'Student',
              subject: `Invoice paid: ${invoice.invoiceNumber || ''}`,
              message: `Payment of ₹${invoice.amount || 0} confirmed for ${invoice.courseName || 'invoice'}.`,
              read: false,
              createdAt: FieldValue.serverTimestamp(),
            })

            await sendAdminPaymentAlert({
              studentName: studentData.name || invoice.studentName || 'Student',
              studentEmail: studentData.email || invoice.studentEmail || '',
              amount: invoice.amount || 0,
              itemName: invoice.courseName || 'Invoice Payment',
              paymentId,
              orderId,
              method: 'Razorpay (webhook)',
              invoiceNumber: invoice.invoiceNumber || '',
            })
          }
        }
      } else if (uid && courseId) {
        const studentDoc = await db.collection('students').doc(uid).get()
        const studentData = studentDoc.exists ? studentDoc.data() : {}

        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 6) // default 6 months if not passed in notes

        const enrollRefWh = await db.collection('enrollments').add({
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
          studentUid: uid,
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

        // Create invoice doc (idempotent: skip if one exists for this orderId)
        const existingInv = await db.collection('invoices').where('orderId', '==', orderId).limit(1).get()
        let invoiceNumberWh = ''
        if (existingInv.empty) {
          invoiceNumberWh = buildInvoiceNumber(enrollRefWh.id)
          const paidDateStrWh = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          await db.collection('invoices').add({
            invoiceNumber: invoiceNumberWh,
            studentUid: uid,
            studentName: studentData.name || 'Student',
            studentEmail: studentData.email || '',
            courseName: notes.courseTitle || 'Course',
            description: '6-month plan',
            amount,
            status: 'paid',
            paidAt: paidDateStrWh,
            issuedDate: paidDateStrWh,
            method: 'razorpay',
            paymentId,
            orderId,
            enrollmentId: enrollRefWh.id,
            createdAt: FieldValue.serverTimestamp(),
          })
        }

        await db.collection('notifications').add({
          studentUid: uid,
          studentName: studentData.name || 'Student',
          subject: `Payment confirmed: ${notes.courseTitle || 'Course'}`,
          message: `Payment of ₹${amount} received. Access unlocked.`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        })

        // SEND RECEIPT EMAIL
        await sendReceiptEmail(
          studentData.email || '',
          studentData.name || 'Student',
          amount,
          notes.courseTitle || 'Course',
          new Date().toLocaleString('en-IN'),
          orderId
        )

        await sendAdminPaymentAlert({
          studentName: studentData.name || 'Student',
          studentEmail: studentData.email || '',
          amount,
          itemName: notes.courseTitle || 'Course',
          paymentId,
          orderId,
          method: 'Razorpay (webhook)',
          invoiceNumber: invoiceNumberWh,
        })
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = req.body.payload.payment.entity
      const orderId = paymentEntity.order_id
      
      if (orderId) {
        const orderRef = db.collection('razorpayOrders').doc(orderId)
        try {
          await orderRef.update({
            status: 'failed',
            failedAt: FieldValue.serverTimestamp(),
            errorDescription: paymentEntity.error_description || 'Payment failed via webhook'
          })
        } catch (e) {
          console.error('Failed to update order status to failed:', e)
        }
      }
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).send('Internal Error')
  }
})
