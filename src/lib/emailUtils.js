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

export const sendTeacherStatusEmail = async (teacherName, teacherEmail, status) => {
  try {
    let message = '';
    let subject = '';

    if (status === 'approved') {
      subject = 'Application Approved - Welcome!';
      message = `Dear ${teacherName},\n\nCongratulations! Your application to become a teacher at RBT Mission Learning has been approved. Please contact the institution administrator immediately to proceed with your onboarding.\n\nBest regards,\nRBT Mission Learning Team`;
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
