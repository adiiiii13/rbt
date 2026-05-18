# RBT Mission Learning - Implementation Plan (Firebase)

## Current State Analysis

**Stack:** React 19 + Vite + Tailwind CSS 4 + Framer Motion + React Router 7
**Data:** All stored in localStorage (courses, videos, PDFs, students, notices, etc.)
**Auth:** localStorage-based, hardcoded admin credentials, student list in JS file
**File Upload:** Simulated (no real upload)
**Payment:** None
**Backend:** None

### Key Problems
1. Admin can't upload real files (images, PDFs) without editing code
2. No payment system for premium demo classes
3. No counselling room feature
4. All data lost on browser clear (localStorage only)

---

## Architecture Decision: Firebase

**Why Firebase:**
- Free tier (Spark plan): 1GB Firestore, 5GB Storage, 50K reads/day
- Firebase Auth: email/password free, unlimited
- Firebase Storage: file uploads with security rules
- Firebase Firestore: NoSQL real-time database
- No backend server needed
- Admin uploads files directly from browser

---

## Step-by-Step Implementation

### PHASE 1: Firebase Setup (Foundation)

#### Step 1.1: Install Firebase
```
npm install firebase
```

#### Step 1.2: Create Firebase Project
- Go to console.firebase.google.com
- Create new project "RBT Mission Learning"
- Enable Firestore Database
- Enable Storage
- Enable Authentication (Email/Password)
- Get config keys from Project Settings

#### Step 1.3: Create Firebase Config
**File:** `src/lib/firebase.js`
```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
```

#### Step 1.4: Firestore Collections Structure
```
courses/{id}
  - title, description, subjects[], level, duration, students, image, color, createdAt

videos/{id}
  - title, subject, class, duration, teacher, videoUrl, thumbnailUrl, views, isFree, price, createdAt

pdfs/{id}
  - title, class, subject, examType, date, fileUrl, downloads, createdAt

gallery/{id}
  - title, category, imageUrl, createdAt

students/{id}
  - studentId, name, email, password, class, course, phone, status, joinDate, createdAt

notices/{id}
  - title, content, category, priority, date, createdAt

achievements/{id}
  - studentName, result, course, year, createdAt

testimonials/{id}
  - name, role, text, rating, type, createdAt

payments/{id}
  - studentId, videoId, videoTitle, amount, gpayTransactionId, status, invoiceNumber, paidAt, createdAt

counsellingBookings/{id}
  - studentName, parentName, phone, email, preferredDate, preferredTime, topic, status, meetingLink, createdAt

inquiries/{id}
  - name, class, course, phone, message, date, createdAt
```

#### Step 1.5: Storage Structure
```
/images/
  /courses/     - course thumbnails
  /gallery/     - gallery photos
  /videos/      - video thumbnails
/pdfs/          - test papers, study materials
```

#### Step 1.6: Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for most collections
    match /courses/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /videos/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /pdfs/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /gallery/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /students/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /payments/{id} {
      allow read: if request.auth != null;
      allow write: if true;
    }
    match /counsellingBookings/{id} {
      allow read: if request.auth != null;
      allow write: if true;
    }
    match /notices/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /achievements/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /testimonials/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /inquiries/{id} {
      allow read: if request.auth != null;
      allow write: if true;
    }
  }
}
```

#### Step 1.7: Storage Security Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /pdfs/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType == 'application/pdf';
    }
  }
}
```

---

### PHASE 2: File Upload Without Code (Requirement 1)

#### Step 2.1: Create FileUpload Component
**File:** `src/components/FileUpload.jsx`
- Drag-and-drop zone
- File type validation (images: jpg/png/webp, docs: pdf)
- Progress bar during upload
- Upload to Firebase Storage
- Return download URL

#### Step 2.2: Create Firebase Data Helpers
**File:** `src/lib/firebaseHelpers.js`
- Generic CRUD functions for Firestore
- `getCollection(name)` - fetch all docs
- `addDocument(name, data)` - add new doc
- `updateDocument(name, id, data)` - update doc
- `deleteDocument(name, id)` - delete doc
- `uploadFile(path, file)` - upload to Storage
- `deleteFile(path)` - delete from Storage

#### Step 2.3: Update Admin ManageCourses
- Add image upload field (replaces icon selector)
- Upload course thumbnail to `/images/courses/`
- Save download URL to Firestore courses collection

#### Step 2.4: Update Admin ManagePdfs
- Real PDF upload to `/pdfs/`
- Save download URL to Firestore pdfs collection
- Students can download actual files

#### Step 2.5: Update Admin ManageVideos
- Add thumbnail upload
- Add `isFree` toggle (free vs paid)
- Add `price` field (for paid videos)

#### Step 2.6: Create Admin Gallery Management
**File:** `src/pages/admin/ManageGallery.jsx` (NEW)
- Upload images to `/images/gallery/`
- Add title, category
- Gallery page reads from Firestore

#### Step 2.7: Replace localStorage Data Layer
Replace all `src/data/*.js` files with Firestore queries:
- `src/data/courses.js` → uses `getCollection('courses')`
- `src/data/videos.js` → uses `getCollection('videos')`
- `src/data/pdfs.js` → uses `getCollection('pdfs')`
- Same for all data files

---

### PHASE 3: Paid Demo Classes with Google Pay (Requirement 2)

#### Step 3.1: Video Pricing Model
Each video document has:
- `isFree: true` → anyone can watch
- `isFree: false` → must pay `price` amount
- Payment goes to institute's Google Pay UPI ID

#### Step 3.2: Payment Flow
```
Student clicks paid video
  → Shows price + "Pay with Google Pay" button
  → Opens Google Pay UPI deep link / shows QR code
  → Student pays on their phone
  → Student enters UPI Transaction ID
  → System saves payment to Firestore
  → Auto-generates invoice number (RBT-INV-0001)
  → Invoice shown immediately
  → Video unlocked for student
```

#### Step 3.3: Google Pay UPI Integration
**UPI Deep Link:**
```
upi://pay?pa=rbtmission@upi&pn=RBT%20Mission%20Learning&am={price}&cu=INR&tn=Video:%20{title}
```
- Opens Google Pay / PhonePe / any UPI app
- Student completes payment
- Returns to site

**QR Code:**
- Generate UPI QR code with exact amount
- Student scans with any UPI app

#### Step 3.4: Payment Page
**File:** `src/pages/student/Payment.jsx`
- Shows video details + price
- UPI QR code with exact amount
- "Open Google Pay" button (UPI deep link)
- Input field for Transaction ID after payment
- Submit → saves to `payments` collection
- Auto-generates invoice

#### Step 3.5: Invoice Generation
**File:** `src/lib/invoice.js`
```js
export function generateInvoiceNumber(count) {
  return `RBT-INV-${String(count + 1).padStart(4, '0')}`
}

export function createInvoice(payment) {
  return {
    invoiceNumber: payment.invoiceNumber,
    date: new Date().toLocaleDateString('en-IN'),
    studentName: payment.studentName,
    videoTitle: payment.videoTitle,
    amount: payment.amount,
    transactionId: payment.gpayTransactionId,
    status: 'Paid',
    upiId: 'rbtmission@upi'
  }
}
```

#### Step 3.6: Invoice Display & Print
**File:** `src/components/InvoiceView.jsx`
- RBT branded invoice
- Student name, video title, amount, transaction ID
- Print button / Save as PDF
- Shows immediately after payment

#### Step 3.7: Student Invoices Page
**File:** `src/pages/student/Invoices.jsx`
- List of all payments
- Click to view invoice
- Download/print individual invoices

#### Step 3.8: Update Student Videos Page
- Free videos: play directly
- Paid videos: lock icon + price badge
- Click paid → payment flow → unlock after payment

#### Step 3.9: Admin Payment Management
**File:** `src/pages/admin/ManagePayments.jsx`
- View all payments with status
- Verify/reject transaction IDs
- Revenue stats

---

### PHASE 4: Free Demo Videos (Requirement 3)

#### Step 4.1: Public Videos Page
- Already exists at `/videos`
- Query Firestore: `where('isFree', '==', true)`
- Anyone can watch without login

#### Step 4.2: Student Videos Page
- Shows all videos
- Free ones: play button
- Paid ones: lock icon + price badge
- Purchased ones: unlocked

#### Step 4.3: Admin Toggle
- In ManageVideos, add "Free/Paid" toggle switch
- Set price for paid videos
- Preview what students see

---

### PHASE 5: Counselling Room (Requirement 4)

#### Step 5.1: Public Counselling Page
**File:** `src/pages/Counselling.jsx` (NEW)
- Hero section explaining counselling service
- Booking form:
  - Student name
  - Parent name
  - Phone number
  - Email (optional)
  - Preferred date picker
  - Preferred time slot (9AM-12PM, 2PM-5PM, 5PM-8PM)
  - Topic dropdown (Academic Performance, Career Guidance, Personal Issues, Admission Query, Fee Related)
- Submit → saves to `counsellingBookings` collection
- Confirmation message

#### Step 5.2: Student Counselling Room
**File:** `src/pages/student/Counselling.jsx` (NEW)
- Book new session
- View upcoming sessions with status (pending/approved/completed)
- Join meeting button (when admin adds Google Meet link)
- Past session history

#### Step 5.3: Admin Counselling Management
**File:** `src/pages/admin/ManageCounselling.jsx` (NEW)
- View all booking requests
- Approve / reschedule / reject
- Add Google Meet link when approving
- Add session notes after completion
- Stats: total bookings, pending, completed

#### Step 5.4: Meeting Integration
- Admin creates Google Meet link manually (meet.new)
- Pastes link when approving booking
- Student sees "Join Meeting" button
- Opens Google Meet in new tab
- Both student and parent can join

#### Step 5.5: Counselling Room Features
- Private video call via Google Meet
- Scheduled time slots
- Session history with notes
- Parent + Student both can join same meeting

---

### PHASE 6: Update Existing Pages

#### Step 6.1: Update AuthContext
- Firebase Auth for admin (email/password)
- Student login: query `students` collection by studentId + password
- Session persistence via Firebase Auth state

#### Step 6.2: Update Admin Dashboard
- Real stats from Firestore counts
- Revenue from payments collection
- Counselling bookings count
- Recent activity feed

#### Step 6.3: Update Student Dashboard
- Purchased videos count
- Upcoming counselling sessions
- Download history
- Invoice history with links

#### Step 6.4: Update Navbar
- Add "Counselling" link (public)
- Add "My Invoices" link (student dashboard)
- Add "Counselling" link (student dashboard)

#### Step 6.5: Update App.jsx Routes
```
New routes:
/counselling              → Public counselling booking
/student/counselling      → Student counselling room
/student/payments         → Payment history & invoices
/student/invoice/:id      → Individual invoice view
/admin/payments           → Manage payments
/admin/counselling        → Manage counselling bookings
/admin/gallery            → Manage gallery images
```

#### Step 6.6: Update DashboardLayout
Add new sidebar links:
- Student: Counselling, My Invoices
- Admin: Payments, Counselling, Gallery

---

### PHASE 7: Final Polish

#### Step 7.1: Error Handling
- Loading spinners for all Firestore calls
- Error boundaries for each page
- Offline fallback message
- Toast notifications for actions

#### Step 7.2: Mobile Responsiveness
- Payment flow works on mobile (UPI deep link opens GPay app)
- Counselling booking mobile-friendly
- Invoice printable on mobile
- QR code scannable on mobile

#### Step 7.3: Environment Variables
**File:** `.env`
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_UPI_ID=rbtmission@upi
```

---

## New File Structure

```
src/
├── lib/
│   ├── firebase.js            (NEW - Firebase config & init)
│   ├── firebaseHelpers.js     (NEW - Generic CRUD + upload functions)
│   ├── courses.js             (NEW - Firestore course operations)
│   ├── videos.js              (NEW - Firestore video operations)
│   ├── pdfs.js                (NEW - Firestore PDF operations)
│   ├── students.js            (NEW - Firestore student operations)
│   ├── payments.js            (NEW - Payment logic)
│   ├── invoice.js             (NEW - Invoice generation)
│   └── counselling.js         (NEW - Counselling CRUD)
├── components/
│   ├── FileUpload.jsx         (NEW - Drag-drop upload with progress)
│   ├── UPIPayment.jsx         (NEW - UPI QR + deep link component)
│   ├── InvoiceView.jsx        (NEW - Invoice display + print)
│   ├── CounsellingForm.jsx    (NEW - Booking form component)
│   └── Toast.jsx              (NEW - Notification toast)
├── pages/
│   ├── Counselling.jsx        (NEW - Public counselling booking)
│   ├── student/
│   │   ├── Counselling.jsx    (NEW - Student counselling room)
│   │   ├── Payment.jsx        (NEW - Make payment for video)
│   │   └── Invoices.jsx       (NEW - Invoice list + view)
│   └── admin/
│       ├── ManageGallery.jsx   (NEW - Gallery management)
│       ├── ManagePayments.jsx  (NEW - Payment management)
│       └── ManageCounselling.jsx (NEW - Counselling management)
├── data/                       (DELETE - replaced by lib/)
└── context/
    └── AuthContext.jsx         (MODIFY - Firebase Auth)
```

---

## Execution Order

1. **Firebase setup** → Create project, enable services, add config
2. **Data helpers** → Build generic Firestore CRUD functions
3. **Data migration** → Replace localStorage with Firestore queries
4. **File upload** → Admin can upload images/PDFs without code
5. **Free/Paid videos** → Add isFree flag, public video filtering
6. **Payment system** → UPI integration, QR codes, invoice generation
7. **Counselling room** → Booking, scheduling, Google Meet links
8. **Route updates** → Add new pages to App.jsx + DashboardLayout
9. **Polish** → Error handling, loading states, mobile fixes

---

## Dependencies to Install

```bash
npm install firebase           # Firebase SDK
npm install qrcode.react       # UPI QR code generation
npm install react-hot-toast    # Toast notifications
```

---

## Cost: FREE (Firebase Spark Plan)

| Service | Free Tier Limit |
|---------|----------------|
| Firestore | 1GB storage, 50K reads/day, 20K writes/day |
| Storage | 5GB storage, 1GB download/day |
| Auth | Unlimited email/password auth |
| Hosting | 10GB storage, 360MB/day transfer |

- Google Pay / UPI: No integration fees
- No payment gateway needed (direct UPI)
