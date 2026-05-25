const { execSync } = require('child_process');

async function main() {
  const PROJECT_ID = 'rbt-website-918b6';
  
  console.log('Fetching all students...');
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students?pageSize=1000`);
  const data = await res.json();
  
  const docs = data.documents || [];
  console.log(`Found ${docs.length} students total.`);
  
  const admins = [];
  const nonAdmins = [];
  
  for (const doc of docs) {
    const role = doc.fields?.role?.stringValue;
    if (role === 'admin') {
      admins.push(doc.name);
    } else {
      nonAdmins.push(doc.name);
    }
  }
  
  console.log(`Keeping ${admins.length} admins.`);
  console.log(`Deleting ${nonAdmins.length} non-admin students...`);
  
  for (const name of nonAdmins) {
    // name looks like: projects/rbt-website-918b6/databases/(default)/documents/students/UID
    const parts = name.split('/');
    const collection = parts[parts.length - 2];
    const docId = parts[parts.length - 1];
    console.log(`Deleting ${collection}/${docId}`);
    try {
      execSync(`firebase firestore:delete -f ${collection}/${docId}`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Error deleting ${collection}/${docId}:`, e.message);
    }
  }
  
  const collectionsToWipe = [
    'courses',
    'enrollments',
    'payments',
    'invoices',
    'pdfs',
    'notices',
    'achievements',
    'counsellingBookings',
    'doubts',
    'gallery',
    'inquiries',
    'notifications',
    'offers',
    'studyMaterial',
    'videos',
    'razorpayOrders',
    'mockAttempts',
    'mockTestAccess',
    'teacherApplications',
    'batchRequests',
    'adminAlerts',
    'offlineBatches',
    'courseDoubts',
    'courseInquiries',
    'courseReports',
    'guestCodes',
    '_deleted'
  ];
  
  for (const col of collectionsToWipe) {
    console.log(`Wiping entire collection: ${col}`);
    try {
      execSync(`firebase firestore:delete -r -f ${col}`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Error wiping ${col}:`, e.message);
    }
  }
  
  console.log('Done!');
}

main().catch(console.error);
