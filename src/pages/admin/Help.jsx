import { useState } from 'react'

const categories = [
  {
    name: 'Content Management',
    features: [
      {
        title: 'Manage Courses',
        icon: '📚',
        what: 'Full course system with pricing variants and lesson structure. Each course has title, description, subjects, level, duration, thumbnail, icon, color.',
        workflow: ['+ Add Course → fill Basic Info (title, description, subjects, level, duration, thumbnail)', 'Pricing tab: add multiple variants (3-month, 6-month etc.) with price, original price, discount label, note', 'Lessons tab: add video lessons with title, URL, duration, description, free/paid toggle', 'Reorder lessons with up/down arrows', 'Delete demo courses individually', 'Students see courses on Home + Courses page, click → Course Detail page with variants + lesson player'],
        tips: 'Subjects comma separated. Variants let you offer different pricing tiers. Free lessons visible to everyone.',
      },
      {
        title: 'Manage Videos',
        icon: '🎬',
        what: 'Add YouTube videos or upload own video files. Free = everyone sees, Paid = needs payment.',
        workflow: ['+ Add Video → choose "YouTube URL" or "Upload Video"', 'YouTube: paste any YouTube link, auto-embeds in player', 'Upload: select video file (warns over 500MB, no hard limit)', 'Add thumbnail (upload image or paste URL)', 'Toggle Free/Paid. If paid: set price', 'Click any video → opens /video/:id player page', 'Delete All removes all videos at once', 'Delete demo videos individually'],
      },
      {
        title: 'Manage PDFs',
        icon: '📄',
        what: 'Upload test papers, worksheets. Upload PDF or paste URL (Google Drive).',
        workflow: ['+ Add PDF → Upload file (max 50MB) or paste URL', 'Fill: title, class, subject, exam type, date', 'Appears on Test Papers page + Student PDFs page', 'Delete individual demo PDFs'],
      },
      {
        title: 'Manage Gallery',
        icon: '🖼️',
        what: 'Upload campus photos. Upload image or paste URL.',
        workflow: ['+ Add Image → Upload file or paste URL', 'Fill: title, category', 'Appears on Gallery page with category filter tabs', 'Hover card → Edit/Delete overlay'],
      },
      {
        title: 'Testimonials',
        icon: '💬',
        what: 'Student/parent quotes with star ratings (1-5).',
        workflow: ['+ Add → name, role, type (student/parent), text, rating', 'Shows on Home page'],
      },
      {
        title: 'Achievements',
        icon: '🏆',
        what: 'Student results, ranks, exam scores.',
        workflow: ['+ Add → student name, course, result, marks, year, description', 'Shows on Achievements page + Student dashboard'],
      },
      {
        title: 'Study Material',
        icon: '📖',
        what: 'Upload study materials for students organized by subject and class.',
        workflow: ['+ Add → fill title, subject, class, URL/file', 'Students see on Study Material page'],
      },
      {
        title: 'Manage Mock Tests',
        icon: '📝',
        what: 'Create online MCQ tests with questions, 4 options, correct answer, time limit. Questions can have images.',
        workflow: ['+ Add Mock Test → set title, subject, duration, marks per question, negative marking', 'Add questions: question text, 4 options, select correct answer, optional explanation', 'Upload image for each question (supports math diagrams, science figures)', 'Bulk import via JSON paste', 'Students take tests on Test Papers → Mock Tests page', 'Timer + fullscreen + anti-cheat (tab switch detection)'],
        tips: 'Image upload helps with math/diagram questions. Import JSON: {question, options:[a,b,c,d], correctIndex, explanation, imageUrl}',
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
        workflow: ['+ Add Student → fill ID, name, email, phone, class, course, password (min 8 chars)', 'Click "Create Student Account" → Cloud Function creates real Auth account', 'Student can now login with email + password', 'Edit: update name, email, phone, course, class', 'Disable: blocks login', 'Enable: re-enables login', 'Delete: permanently removes account + all data'],
        tips: 'Student ID format: "STU001". Password shared with student privately.',
      },
      {
        title: 'Counselling Bookings',
        icon: '📅',
        what: 'Student books counselling → admin approves with Meet link → student joins. Shows batch/non-batch label.',
        workflow: ['Student fills form → booking appears with "Pending" status', 'Admin sees Type column (Batch / Non-batch)', 'Approve → paste Google Meet link → student sees it', 'Complete / Reject / Edit / Delete any booking'],
      },
      {
        title: 'Doubts',
        icon: '❓',
        what: 'Students submit questions with text + photo. Admin replies.',
        workflow: ['Student → My Doubts → Ask Doubt → text + optional photo', 'Photo uploads to Firebase Storage', 'Admin → Doubts → Reply with answer', 'Student sees answer on their page', 'Status: pending → answered'],
      },
    ],
  },
  {
    name: 'Communication',
    features: [
      {
        title: 'Notices',
        icon: '📢',
        what: 'Publish announcements. FCM push to all active students.',
        workflow: ['+ Add Notice → title, content, priority, category', 'Publish → auto-push notification to all students', 'Shows on Student Notices page'],
      },
      {
        title: 'Contact Inquiries',
        icon: '📧',
        what: 'Contact form submissions.',
        workflow: ['Visitor fills form', 'Appears here with unread badge', 'View, mark read, reply email, delete'],
      },
      {
        title: 'Send Notifications',
        icon: '🔔',
        what: 'Send notification to specific student. They see it on their dashboard.',
        workflow: ['+ Send Notification → search student by name/email/ID', 'Dropdown shows matching students → click to select', 'Write subject + message → Send', 'Student sees notification on dashboard instantly'],
        tips: 'Search helps find students quickly. Notifications appear in amber box on student dashboard.',
      },
      {
        title: 'Offers',
        icon: '🎁',
        what: 'Popup banner on homepage. Click redirects to WhatsApp.',
        workflow: ['+ Add Offer → title, message, WhatsApp phone, prefilled message, bg color', 'Toggle Active → popup shows on homepage', 'Click → WhatsApp redirect', 'Dismiss = session only'],
        tips: 'Phone: "918888888888" (no +). One active at a time.',
      },
    ],
  },
  {
    name: 'Payments & Finance',
    features: [
      {
        title: 'Manage Payments',
        icon: '💰',
        what: 'Student pays UPI → verify → student gets access.',
        workflow: ['Student clicks locked video → payment page', 'Pays UPI → enters transaction ID', 'Payment appears with Pending status', 'Verify → student unlocks content', 'Reject → student notified'],
      },
      {
        title: 'Create Invoices',
        icon: '🧾',
        what: 'Create invoices for specific students.',
        workflow: ['+ Create Invoice → search student', 'Fill: course, description, amount, due date', 'Student sees on their Invoices page'],
        tips: 'Search by name/email/ID.',
      },
    ],
  },
  {
    name: 'Exam System',
    features: [
      {
        title: 'Mock Tests (Student)',
        icon: '🎯',
        what: 'Students take timed MCQ tests with fullscreen mode and anti-cheat.',
        workflow: ['Student → Test Papers → Mock Tests → choose test', 'Fullscreen mode + timer', 'Tab switch detected → warning → auto-submit after 3 violations', 'Submit → shows score, correct/wrong/skipped'],
      },
      {
        title: 'Mock Results (Student)',
        icon: '🏅',
        what: 'Student sees all past test attempts with full question-by-question breakdown.',
        workflow: ['Student → My Results → see all attempts', 'Each card: test name, date, correct/wrong/skipped/score %', 'Click "View Full Results" → modal with every question', 'Shows: question text + image, all options, your answer (red), correct answer (green), explanation'],
        tips: 'Helps students review mistakes and learn from explanations.',
      },
      {
        title: 'Mock Results (Admin)',
        icon: '📊',
        what: 'Admin sees all student test attempts across all tests.',
        workflow: ['Admin → Mock Results → see all attempts', 'Filter by test, student, status', 'View detailed breakdown per attempt'],
      },
    ],
  },
  {
    name: 'System & Settings',
    features: [
      {
        title: 'Seed Data',
        icon: '🌱',
        what: 'Fills empty collections with demo content.',
        workflow: ['Dashboard → Seed Data', 'Only fills empty collections', 'Delete individual demo items from each page'],
      },
      {
        title: 'Batch vs Basic Login',
        icon: '🔐',
        what: 'Two student types: Batch (full access) vs Basic (limited).',
        workflow: ['Batch: Google + code "2026" → full dashboard (11 pages)', 'Basic: Google only → limited (courses, videos, test series, payment)', 'Batch: counselling, invoices, notices, achievements, doubts, mock results', 'Basic: browse courses, watch free videos, download PDFs'],
      },
      {
        title: 'Cloud Functions',
        icon: '⚡',
        what: '8 deployed functions.',
        workflow: ['createStudent, disableStudent, deleteStudent', 'grantAdminRole, initializeStudentAccount', 'onNoticeCreated → FCM push to students', 'onCounsellingCreated → FCM push to admin', 'onContactCreated → FCM push to admin'],
      },
      {
        title: 'Firebase Storage',
        icon: '📁',
        what: 'Cloud storage for uploads.',
        workflow: ['Gallery: public/gallery/', 'PDFs: pdfs/', 'Videos: videos/ + thumbnails', 'Doubt photos: doubts/{uid}/', 'Mock test images: mock-tests/images/'],
      },
      {
        title: 'Video Player',
        icon: '🎬',
        what: 'Dedicated player page for each video.',
        workflow: ['Click any video → /video/:id page opens', 'YouTube URLs → auto-embed iframe', 'Uploaded files → native HTML5 player', 'Back button + video info + class/subject badges'],
      },
      {
        title: 'Help Section',
        icon: '📋',
        what: 'You are here! Complete guide to all admin features.',
        workflow: ['Search features by name or keyword', 'Each feature: what it does + step-by-step workflow + tips', 'Browse by category or use search bar'],
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
        <p className="text-slate-400 text-sm mb-4">Every feature documented — search or browse</p>
        <input
          className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand transition-all"
          placeholder="Search features..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && <p className="text-slate-500 text-center py-8">No match for "{search}"</p>}

      {filtered.map((cat, ci) => (
        <div key={ci} className="mb-6">
          <h2 className="text-sm font-bold text-green-brand uppercase tracking-wider mb-3">{cat.name}</h2>
          <div className="space-y-3">
            {cat.features.map((f, fi) => {
              const key = `${ci}-${fi}`
              const isOpen = expanded === key
              return (
                <div key={fi} className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : key)} className="w-full flex items-center justify-between p-4 text-left cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{f.icon}</span>
                      <div><h3 className="font-bold text-white">{f.title}</h3><p className="text-xs text-slate-400 mt-0.5">{f.what}</p></div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <ol className="space-y-2">{f.workflow.map((step, j) => (
                        <li key={j} className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-green-brand/20 text-green-brand text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{j + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}</ol>
                      {f.tips && <div className="mt-3 bg-amber-500/5 rounded-xl p-3 border border-amber-500/10"><p className="text-xs font-bold text-amber-400 uppercase mb-1">Tip</p><p className="text-sm text-slate-300">{f.tips}</p></div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="bg-[#111111] rounded-2xl p-5 border border-slate-800 mt-6">
        <h3 className="font-bold text-white mb-3">Quick Reference</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Admin: rbtmissionlearningofficial@gmail.com</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Batch code: 2026</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Deployed: Firebase + Netlify</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">GitHub: adiiii13/rbt + rbtmission/rbtmissionlearning</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Cloud Functions: 8 deployed</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Realtime: onSnapshot (instant sync)</span></div>
        </div>
      </div>
    </div>
  )
}
