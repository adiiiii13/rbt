import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sends an email using the Firebase "Trigger Email" Extension.
 * 
 * HOW TO SET IT UP:
 * 1. Go to your Firebase Console -> Extensions.
 * 2. Search for and install "Trigger Email" (by Firebase).
 * 3. During installation, it will ask for an SMTP connection URI.
 *    - For Gmail, use: smtps://your-email@gmail.com:YOUR_APP_PASSWORD@smtp.gmail.com:465
 *    - Make sure to generate an "App Password" from your Google Account security settings.
 * 4. Set the Email document collection to "mail" (which is what this code uses).
 * 5. Once installed, any document added to the "mail" collection will be automatically sent by Firebase securely.
 */

export const sendTeacherStatusEmail = async (teacherName, teacherEmail, status, joiningDetails = '') => {
  try {
    let message = '';
    let subject = '';

    if (status === 'approved') {
      subject = 'Application Approved - Welcome to RBT Mission Learning!';
      message = `Dear ${teacherName},\n\nCongratulations! Your application to become a teacher at RBT Mission Learning has been approved.\n\n${joiningDetails ? `**Important Joining Details / Next Steps:**\n${joiningDetails}\n\n` : ''}Please contact the institution administrator if you have any questions.\n\nBest regards,\nRBT Mission Learning Team`;
    } else if (status === 'rejected') {
      subject = 'Application Status Update';
      message = `Dear ${teacherName},\n\nThank you for applying to teach at RBT Mission Learning. Unfortunately, we will not be moving forward with your application at this time. We wish you the best and encourage you to try again in the future.\n\nBest regards,\nRBT Mission Learning Team`;
    } else {
      return; // Do nothing for other statuses
    }

    // Add a document to the 'mail' collection to trigger the Firebase extension
    await addDoc(collection(db, 'mail'), {
      to: teacherEmail,
      message: {
        subject: subject,
        text: message,
      },
      createdAt: serverTimestamp(),
    });

    console.log('Email queued successfully via Firebase Extension');
  } catch (error) {
    console.error('Failed to queue email:', error);
    throw error;
  }
};

export const sendStudentStatusEmail = async (studentName, studentEmail, status, context = '') => {
  try {
    let message = '';
    let subject = '';

    if (status === 'disabled') {
      subject = 'Important: Account Access Disabled';
      message = `Dear ${studentName},\n\nYour account access at RBT Mission Learning has been temporarily disabled. ${context ? `Reason: ${context}. ` : ''}Please contact the administrator for more information or to resolve this issue.\n\nBest regards,\nRBT Mission Learning Team`;
    } else if (status === 'active') {
      subject = 'Account Access Restored';
      message = `Dear ${studentName},\n\nYour account access at RBT Mission Learning has been restored. You can now log in and access your courses.\n\nBest regards,\nRBT Mission Learning Team`;
    } else if (status === 'revoked') {
      subject = 'Course Access Revoked';
      message = `Dear ${studentName},\n\nYour access to the course "${context}" has been revoked. If you believe this is a mistake, please contact the administrator.\n\nBest regards,\nRBT Mission Learning Team`;
    } else if (status === 'granted') {
      subject = 'Course Access Granted';
      message = `Dear ${studentName},\n\nGood news! You have been granted access to the course "${context}". You can now log in and start learning.\n\nBest regards,\nRBT Mission Learning Team`;
    } else if (status === 'batch_approved') {
      subject = 'Batch Request Approved - Welcome!';
      message = `Dear ${studentName},\n\nCongratulations! Your request to join the batch at RBT Mission Learning has been approved. You can now access your batch dashboard.\n\nBest regards,\nRBT Mission Learning Team`;
    } else if (status === 'batch_rejected') {
      subject = 'Batch Request Status Update';
      message = `Dear ${studentName},\n\nThank you for your interest in joining a batch at RBT Mission Learning. Unfortunately, your request has been declined at this time. Please contact the administrator if you have any questions.\n\nBest regards,\nRBT Mission Learning Team`;
    } else {
      return; // Do nothing for other statuses
    }

    await addDoc(collection(db, 'mail'), {
      to: studentEmail,
      message: {
        subject: subject,
        text: message,
      },
      createdAt: serverTimestamp(),
    });

    console.log(`Student status email (${status}) queued successfully`);
  } catch (error) {
    console.error('Failed to queue student email:', error);
    throw error;
  }
};

export const sendSignupWelcomeEmail = async (name, email) => {
  try {
    const subject = 'Welcome to RBT Mission Learning!';
    const message = `Dear ${name || 'Student'},\n\nWelcome to RBT Mission Learning! We are thrilled to have you join our platform. You can now explore our extensive catalog of courses, mock tests, and study materials.\n\nHappy learning!\n\nBest regards,\nRBT Mission Learning Team`;

    await addDoc(collection(db, 'mail'), {
      to: email,
      message: { subject, text: message },
      createdAt: serverTimestamp(),
    });
    console.log('Signup welcome email queued');
  } catch (error) {
    console.error('Failed to queue signup email:', error);
  }
};

export const sendInvoiceCreatedEmail = async (name, email, invoiceNum, amount, dueDate, courseName) => {
  try {
    const subject = `New Invoice Generated: ${invoiceNum}`;
    const message = `Dear ${name || 'Student'},\n\nA new invoice (${invoiceNum}) has been generated for your account regarding the course: "${courseName}".\n\nAmount Due: ₹${amount}\n${dueDate ? `Due Date: ${dueDate}\n` : ''}\nPlease log in to your dashboard to view and pay this invoice.\n\nBest regards,\nRBT Mission Learning Team`;

    await addDoc(collection(db, 'mail'), {
      to: email,
      message: { subject, text: message },
      createdAt: serverTimestamp(),
    });
    console.log('Invoice created email queued');
  } catch (error) {
    console.error('Failed to queue invoice email:', error);
  }
};

export const sendInvoiceReminderEmail = async (name, email, invoiceNum, amount, dueDate, courseName) => {
  try {
    const subject = `Payment Reminder: Invoice ${invoiceNum}`;
    const message = `Dear ${name || 'Student'},\n\nThis is a friendly reminder regarding your pending invoice (${invoiceNum}) for the course: "${courseName}".\n\nAmount Due: ₹${amount}\n${dueDate ? `Due Date: ${dueDate}\n` : ''}\nPlease log in to your dashboard and complete the payment at your earliest convenience.\n\nBest regards,\nRBT Mission Learning Team`;

    await addDoc(collection(db, 'mail'), {
      to: email,
      message: { subject, text: message },
      createdAt: serverTimestamp(),
    });
    console.log('Invoice reminder email queued');
  } catch (error) {
    console.error('Failed to queue reminder email:', error);
  }
};

export const sendCoursePaymentSuccessEmail = async (name, email, courseName, amount, orderId) => {
  try {
    const subject = `Payment Successful - Welcome to ${courseName}!`;
    const message = `Dear ${name || 'Student'},\n\nThank you for your payment of ₹${amount}. Your transaction (Order ID: ${orderId}) was successful, and you have been granted full access to "${courseName}".\n\nYou can now log in to your dashboard and start learning immediately.\n\nBest regards,\nRBT Mission Learning Team`;

    await addDoc(collection(db, 'mail'), {
      to: email,
      message: { subject, text: message },
      createdAt: serverTimestamp(),
    });
    console.log('Course payment success email queued');
  } catch (error) {
    console.error('Failed to queue payment email:', error);
  }
};
