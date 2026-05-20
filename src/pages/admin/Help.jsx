import { useState } from 'react'

const categories = [
  {
    name: 'Content Management',
    features: [
      {
        title: 'Manage Courses',
        icon: '📚',
        what: 'Full course system with pricing variants and lesson structure. Each course has title, description, subjects, level, duration, thumbnail, icon, color.',
        workflow: ['+ Add Course → fill Basic Info (title, description, subjects, level, duration)', 'Pricing tab: add multiple variants (3-month, 6-month etc.) with price + discount', 'Lessons tab: add video lessons with title, URL, duration, free/paid toggle', 'Reorder lessons with up/down arrows', 'Students see courses on Home + Courses page, click → Course Detail page with variants + lesson player'],
        tips: 'Subjects comma separated. Variants let you offer different pricing tiers. Free lessons visible to everyone.',
      },
      {
        title: 'Manage Videos',
        icon: '🎬',
        what: 'Add YouTube videos or upload own video files. Free = everyone sees, Paid = needs payment.',
        workflow: ['+ Add Video → choose "YouTube URL" or "Upload Video"', 'YouTube: paste any YouTube link, auto-embeds in player', 'Upload: select video file (warns over 500MB, no hard limit)', 'Add thumbnail (upload image or paste URL)', 'Toggle Free/Paid. If paid: set price in INR', 'Appears on Videos page + Student Videos + /video/:id player page'],
        tips: 'Delete All removes all videos at once. YouTube URLs auto-convert to embed on player page.',
      },
      {
        title: 'Manage PDFs',
        icon: '📄',
        what: 'Upload test papers, worksheets. Upload PDF file or paste external URL (Google Drive).',
        workflow: ['+ Add PDF → Upload file (max 50MB) or paste URL', 'Fill: title, class, subject, exam type, date', 'Appears on Test Papers → Downloadable section + Student PDFs page'],
        tips: 'For large files (>50MB), upload to Google Drive → set public → paste link.',
      },
      {
        title: 'Manage Gallery',
        icon: '🖼️',
        what: 'Upload campus photos, lab images, event photos. Upload image or paste URL.',
        workflow: ['+ Add Image → Upload file or paste URL', 'Fill: title, category (Campus/Labs/Events/Facilities/Students)', 'Appears on Gallery page with category filter tabs'],
        tips: 'Hover on any image card to see Edit/Delete overlay.',
      },
      {
        title: 'Testimonials',
        icon: '💬',
        what: 'Student/parent quotes with star ratings (1-5).',
        workflow: ['+ Add → name, role (e.g. "JEE Aspirant"), type (student/parent), text, rating', 'Shows on Home page testimonials section'],
      },
      {
        title: 'Achievements',
        icon: '🏆',
        what: 'Student results, ranks, exam scores.',
        workflow: ['+ Add → student name, course, result (e.g. "AIR 45"), marks, year, description', 'Shows on Achievements page (public) + Student Achievements page'],
      },
      {
        title: 'Study Material',
        icon: '📖',
        what: 'Upload study materials for students organized by subject and class.',
        workflow: ['+ Add → fill title, subject, class, URL/file', 'Students see on Study Material page in student dashboard'],
      },
      {
        title: 'Mock Tests',
        icon: '📝',
        what: 'Create online MCQ tests with questions, 4 options, correct answer, time limit.',
        workflow: ['+ Add Mock Test → set title, subject, duration, marks per question', 'Add questions: question text, 4 options, select correct answer', 'Students take tests on Test Papers → Mock Tests page', 'Timer runs during test, results shown after submit'],
      },
    ],
  },
  {
    name: 'Student Management',
    features: [
      {
        title: 'Manage Students',
        icon: '👨‍🎓',
        what: 'Create real Firebase Auth student accounts. Edit details, disable/enable login, delete permanently.',
        workflow: ['+ Add Student → fill ID, name, email, phone, class, course, password (min 8 chars)', 'Click "Create Student Account" → Cloud Function creates real Auth account', 'Student can now login at /student-login with email + password', 'Edit: update name, email, phone, course, class', 'Disable: blocks login (student can\'t access dashboard)', 'Enable: re-enables login', 'Delete: permanently removes account + all data'],
        tips: 'Student ID format: "STU001". Password should be shared with student privately.',
      },
      {
        title: 'Counselling Bookings',
        icon: '📅',
        what: 'Student books counselling → admin approves with Google Meet link → student joins from dashboard. Shows batch/non-batch label.',
        workflow: ['Student fills form → booking appears with "Pending" status', 'Admin sees booking with Type column (Batch Student / Non-batch Student)', 'Click "Approve" → paste Google Meet link → student gets notified', 'Student dashboard shows "Join Meeting" button', 'Click "Complete" after session, "Reject" to decline', 'Edit: change topic, date, time, meet link, status', 'Delete: remove booking permanently'],
        tips: 'Create Meet link at meet.new. Type shows if student is batch or non-batch.',
      },
      {
        title: 'Doubts',
        icon: '❓',
        what: 'Students submit questions with text + photo upload. Admin replies with text answer.',
        workflow: ['Student → My Doubts → Ask Doubt → add text question + optional photo', 'Photo uploads to Firebase Storage (max 5MB)', 'Admin → Doubts → sees pending with photo preview', 'Click "Reply" → write answer → student sees answer on their doubts page', 'Status: pending → answered'],
        tips: 'Photo helps with math problems, diagrams, handwriting questions.',
      },
    ],
  },
  {
    name: 'Communication',
    features: [
      {
        title: 'Notices',
        icon: '📢',
        what: 'Publish announcements to all students. FCM push notification sent to all active students\' phones.',
        workflow: ['+ Add Notice → title, content, priority (high/medium/low), category', 'Click "Publish Notice"', 'Cloud Function auto-triggers → reads all students with FCM token', 'Push notification sent to all student phones', 'Student clicks notification → opens notices page'],
        tips: 'High priority notices show red dot. Categories: General, Academic, Exam, Holiday, Event, Fee.',
      },
      {
        title: 'Contact Inquiries',
        icon: '📧',
        what: 'Contact form submissions from website visitors.',
        workflow: ['Visitor fills contact form on website Contact page', 'Submission appears here with unread badge', 'Click "View" → see full message details', 'Click "Mark Read" to clear badge', 'Click "Reply Email" to open email client', 'Delete: remove inquiry'],
      },
      {
        title: 'Send Notifications',
        icon: '🔔',
        what: 'Send notification to a specific student. They see it on their dashboard in a highlighted box.',
        workflow: ['+ Send Notification → type student name, email, or ID in search box', 'Dropdown shows matching students → click to select', 'Write subject + message', 'Click "Send Notification"', 'Student logs in → dashboard shows notification in amber box instantly'],
        tips: 'Use search box to find student quickly. Search by name, email, or student ID. Students see unread notifications highlighted on dashboard.',
      },
      {
        title: 'Offers',
        icon: '🎁',
        what: 'Promotional popup banner shown to website visitors. Click redirects to WhatsApp with prefilled message.',
        workflow: ['+ Add Offer → title, popup message, WhatsApp phone (with country code), prefilled message, bg color', 'Set start/end dates (optional), check "Active" checkbox', 'Click "Create Offer" → popup appears on homepage for all visitors', 'Visitor sees popup → clicks "Enquire on WhatsApp" → redirected with message', 'Toggle Activate/Deactivate to show/hide popup', 'Dismiss = session only (shows again next session)'],
        tips: 'Phone format: "918888888888" (no + sign). One active offer at a time (latest active wins).',
      },
    ],
  },
  {
    name: 'Payments & Finance',
    features: [
      {
        title: 'Manage Payments',
        icon: '💰',
        what: 'Student pays via UPI → payment appears here → verify → student gets access to paid video.',
        workflow: ['Student clicks locked video → goes to payment page', 'Pays via UPI (shown on payment page) → enters transaction ID', 'Payment appears here with "Pending" status', 'Verify: marks payment as verified → student unlocks content', 'Reject: marks as rejected → student notified', 'Revenue total shows verified payments only'],
        tips: 'Invoice number auto-generated. UPI ID set in .env file.',
      },
      {
        title: 'Create Invoices',
        icon: '🧾',
        what: 'Create invoices for specific students. Student sees them on their Invoices page.',
        workflow: ['+ Create Invoice → type student name/email/ID in search box', 'Dropdown shows matching students → click to select', 'Fill: course/service name, description, amount, due date', 'Click "Create & Send" → invoice appears on student dashboard', 'Delete any invoice if needed'],
        tips: 'Search helps find students quickly. Invoice number auto-generated. Student sees all invoices on their Invoices page.',
      },
    ],
  },
  {
    name: 'System & Settings',
    features: [
      {
        title: 'Seed Data',
        icon: '🌱',
        what: 'Fills empty collections with demo courses, videos, PDFs, achievements, testimonials. Your data stays alongside demo.',
        workflow: ['Go to Dashboard → click "Seed Data"', 'Demo content added to all empty collections', 'Your additions live alongside demo data', 'Delete individual demo items from each manage page (uses deleteItemSmart)'],
        tips: 'Only adds to empty collections. Won\'t overwrite your data. Demo items can be deleted individually.',
      },
      {
        title: 'Batch vs Basic Login',
        icon: '🔐',
        what: 'Two student login types with different access levels. Batch = full access, Basic = limited.',
        workflow: ['Batch Login: Google sign-in + enter batch code "2026" → full dashboard (10 pages)', 'Basic Login: Google sign-in only, no code → limited dashboard (5 pages)', 'Batch access: courses, videos, PDFs, notices, achievements, counselling, invoices, doubts, payment', 'Basic access: courses, videos, free test series, payment only', 'Both redirect correctly on login'],
        tips: 'Batch code is "2026". Change in StudentLogin.jsx BATCH_CODE constant.',
      },
      {
        title: 'Cloud Functions',
        icon: '⚡',
        what: '8 deployed serverless functions handling auth, notifications, and triggers.',
        workflow: ['createStudent: creates real Auth account (called from Manage Students)', 'disableStudent: blocks student login', 'deleteStudent: removes Auth + Firestore data', 'grantAdminRole: sets admin custom claim', 'initializeStudentAccount: sets student claim for Google users', 'onNoticeCreated: FCM push to all students when notice published', 'onCounsellingCreated: FCM push to admin when booking created', 'onContactCreated: FCM push to admin when inquiry submitted'],
      },
      {
        title: 'Firebase Storage',
        icon: '📁',
        what: 'Cloud storage for uploaded files: images, PDFs, videos.',
        workflow: ['Gallery images upload to: public/gallery/', 'PDFs upload to: pdfs/', 'Videos upload to: videos/ (with thumbnail subfolder)', 'Doubt photos upload to: doubts/{uid}/', 'All uploads get public download URL automatically', 'Storage rules enforce: public read, authenticated write, size + MIME limits'],
      },
      {
        title: 'Realtime Sync',
        icon: '🔄',
        what: 'All data syncs instantly. Admin add/edit/delete → visible on public and student pages immediately.',
        workflow: ['useRealtimeCollection hook uses Firestore onSnapshot listener', 'One subscription per collection, shared across components', 'Default/demo data merges with Firestore data', 'Deleted default items tracked in meta/{collection}/deleted', 'No page refresh needed — changes appear in ~1 second'],
      },
    ],
  },
]

export default function HelpPage() {
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = search
    ? categories.map(c => ({ ...c, features: c.features.filter(f =>
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.what.toLowerCase().includes(search.toLowerCase()) ||
        f.workflow.some(w => w.toLowerCase().includes(search.toLowerCase()))
      )})).filter(c => c.features.length > 0)
    : categories

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Admin Help</h1>
        <p className="text-slate-400 text-sm mb-4">Complete guide to every feature — search or browse by category</p>
        <input
          className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand transition-all"
          placeholder="Search features... (e.g. 'upload', 'notification', 'meet link')"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-center py-8">No features match "{search}"</p>
      )}

      {filtered.map((cat, ci) => (
        <div key={ci} className="mb-6">
          <h2 className="text-sm font-bold text-green-brand uppercase tracking-wider mb-3">{cat.name}</h2>
          <div className="space-y-3">
            {cat.features.map((f, fi) => {
              const key = `${ci}-${fi}`
              const isOpen = expanded === key
              return (
                <div key={fi} className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{f.icon}</span>
                      <div>
                        <h3 className="font-bold text-white">{f.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{f.what}</p>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <ol className="space-y-2">
                        {f.workflow.map((step, j) => (
                          <li key={j} className="text-sm text-slate-300 flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-green-brand/20 text-green-brand text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{j + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      {f.tips && (
                        <div className="mt-3 bg-amber-500/5 rounded-xl p-3 border border-amber-500/10">
                          <p className="text-xs font-bold text-amber-400 uppercase mb-1">Tip</p>
                          <p className="text-sm text-slate-300">{f.tips}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Quick Reference */}
      <div className="bg-[#111111] rounded-2xl p-5 border border-slate-800 mt-6">
        <h3 className="font-bold text-white mb-3">Quick Reference</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Admin: rbtmissionlearningofficial@gmail.com</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Batch code: 2026</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">All changes sync instantly (onSnapshot)</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Deployed: Firebase Hosting + Netlify</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">GitHub: github.com/adiiiii13/rbt</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Cloud Functions: 8 deployed (asia-south1)</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Storage: Firebase Storage for uploads</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">FCM: push notifications for notices</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Auth: email/password + Google sign-in</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">TestPapers: downloadable PDFs + online mock tests</span></div>
        </div>
      </div>

      {/* Public Pages */}
      <div className="bg-[#111111] rounded-2xl p-5 border border-slate-800 mt-6">
        <h3 className="font-bold text-white mb-3">Public Website Pages</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/ Home — hero, courses, testimonials, achievements, offer popup</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/about — company info</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/courses — browse courses with pricing</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/videos — free demo videos</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/video/:id — dedicated video player page</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/test-papers — downloadable PDFs + online mock tests</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/achievements — toppers list</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/gallery — campus photos with category filter</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/contact — form → admin inquiries</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/counselling — booking form (non-batch label)</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/student-login — batch + basic login options</span></div>
          <div className="flex items-start gap-2"><span className="text-blue-400">•</span><span className="text-slate-300">/privacy, /terms — legal pages</span></div>
        </div>
      </div>
    </div>
  )
}
