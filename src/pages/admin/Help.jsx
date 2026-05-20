import { useState } from 'react'

const categories = [
  {
    name: 'Content Management',
    features: [
      {
        title: 'Manage Courses',
        icon: '📚',
        what: 'Add/edit/delete courses. Each course: title, description, subjects, level, duration, students, icon, color.',
        workflow: ['Go to Manage Courses → + Add Course', 'Fill all fields', 'Click Add → shows on Home, Courses page, Student dashboard', 'Edit/Delete any item individually'],
        tips: 'Subjects comma separated. Demo courses can be deleted.',
      },
      {
        title: 'Manage Videos',
        icon: '🎬',
        what: 'Add YouTube videos or upload own video files. Free = everyone sees, Paid = needs payment.',
        workflow: ['+ Add Video → choose YouTube URL or Upload Video', 'YouTube: paste link, auto-embeds', 'Upload: select file (max 500MB warning)', 'Add thumbnail (optional)', 'Toggle Free/Paid, set price if paid', 'Appears on Videos page + Student Videos'],
        tips: 'Click any video → opens /video/:id player page. Delete All removes all.',
      },
      {
        title: 'Manage PDFs',
        icon: '📄',
        what: 'Upload test papers, worksheets. Upload PDF or paste URL (Google Drive).',
        workflow: ['+ Add PDF → Upload file (max 50MB) or paste URL', 'Fill: title, class, subject, exam type, date', 'Appears on Test Papers + Student PDFs pages'],
        tips: 'For large files use Google Drive link.',
      },
      {
        title: 'Manage Gallery',
        icon: '🖼️',
        what: 'Upload campus photos. Upload image or paste URL.',
        workflow: ['+ Add Image → Upload file or paste URL', 'Fill: title, category', 'Appears on Gallery page instantly'],
      },
      {
        title: 'Testimonials',
        icon: '💬',
        what: 'Student/parent quotes with star ratings.',
        workflow: ['+ Add → name, role, type, text, rating (1-5)', 'Shows on Home page'],
      },
      {
        title: 'Achievements',
        icon: '🏆',
        what: 'Student results, ranks, exam scores.',
        workflow: ['+ Add → student name, course, result, marks, year', 'Shows on Achievements page + Student dashboard'],
      },
      {
        title: 'Study Material',
        icon: '📖',
        what: 'Upload study materials for students.',
        workflow: ['Go to Study Material → + Add', 'Fill: title, subject, class, URL/file', 'Students see on Study Material page'],
      },
      {
        title: 'Mock Tests',
        icon: '📝',
        what: 'Create online mock tests with questions, options, answers.',
        workflow: ['Go to Mock Tests → + Add', 'Add questions with options and correct answer', 'Students take tests on /student/test-papers/mock page'],
      },
    ],
  },
  {
    name: 'Student Management',
    features: [
      {
        title: 'Manage Students',
        icon: '👨‍🎓',
        what: 'Create student accounts (real Firebase Auth login), edit, disable/enable, delete.',
        workflow: ['+ Add Student → fill ID, name, email, phone, course, password', 'Click Create → real Auth account created → student can login', 'Disable: blocks login', 'Enable: re-enables login', 'Delete: permanently removes'],
        tips: 'Student ID format: "STU001". Password shared with student privately.',
      },
      {
        title: 'Counselling Bookings',
        icon: '📅',
        what: 'Student books counselling → admin approves with Meet link → student joins. Shows batch/non-batch type.',
        workflow: ['Student fills form (auto-labels as Batch or Non-batch)', 'Admin sees booking with Type column', 'Approve → paste Google Meet link → student sees it', 'Reject / Complete / Edit / Delete any booking'],
        tips: 'Create Meet link at meet.new. Type shows if student is batch or non-batch.',
      },
      {
        title: 'Doubts',
        icon: '❓',
        what: 'Students submit questions with text + photo. Admin replies.',
        workflow: ['Student → My Doubts → Ask Doubt → add text + photo', 'Admin → Doubts → sees pending', 'Reply → student sees answer on their doubts page'],
      },
    ],
  },
  {
    name: 'Communication',
    features: [
      {
        title: 'Notices',
        icon: '📢',
        what: 'Publish announcements. FCM push to all students.',
        workflow: ['+ Add Notice → title, content, priority, category', 'Publish → auto-push notification to all students', 'Shows on Student Notices page instantly'],
      },
      {
        title: 'Contact Inquiries',
        icon: '📧',
        what: 'Contact form submissions.',
        workflow: ['Visitor fills form on website', 'Appears here with unread badge', 'View details, mark read, reply email, delete'],
      },
      {
        title: 'Send Notifications',
        icon: '🔔',
        what: 'Send notification to specific student. They see it on their dashboard.',
        workflow: ['+ Send Notification', 'Search student by name/email/ID (dropdown search)', 'Select student → write subject + message', 'Click Send → student sees notification on dashboard instantly'],
        tips: 'Use search box to find student quickly. Student sees unread notifications in amber box on dashboard.',
      },
      {
        title: 'Offers',
        icon: '🎁',
        what: 'Popup banner on homepage. Click redirects to WhatsApp.',
        workflow: ['+ Add Offer → title, message, WhatsApp phone, prefilled message', 'Toggle Active → popup shows on homepage', 'Visitor clicks → redirected to WhatsApp with message', 'Dismiss = session only'],
        tips: 'Phone format: "918888888888" (no + sign). One active offer at a time.',
      },
    ],
  },
  {
    name: 'Payments & Finance',
    features: [
      {
        title: 'Manage Payments',
        icon: '💰',
        what: 'Student pays UPI → payment appears here → verify → student gets access.',
        workflow: ['Student clicks locked video → goes to payment page', 'Pays UPI → enters transaction ID', 'Payment appears here with Pending status', 'Verify → student unlocks content', 'Reject → student notified'],
      },
      {
        title: 'Create Invoices',
        icon: '🧾',
        what: 'Create invoices for specific students. Student sees on their dashboard.',
        workflow: ['+ Create Invoice', 'Search student by name/email/ID (dropdown search)', 'Fill: course/service, description, amount, due date', 'Click Create & Send → invoice appears on student dashboard', 'Delete any invoice'],
        tips: 'Student sees invoices in their Invoices page. Search helps find students quickly.',
      },
    ],
  },
  {
    name: 'System & Settings',
    features: [
      {
        title: 'Seed Data',
        icon: '🌱',
        what: 'Fills empty collections with demo content. Your data stays alongside demo.',
        workflow: ['Dashboard → Seed Data → adds demo courses, videos, PDFs, etc.', 'Only fills empty collections', 'Delete individual demo items from each page'],
      },
      {
        title: 'Batch vs Basic Login',
        icon: '🔐',
        what: 'Two student types with different access levels.',
        workflow: ['Batch Login: Google + code "2026" → full dashboard (10 pages)', 'Basic Login: Google only → limited (courses, videos, test series)', 'Batch: counselling, invoices, notices, achievements, doubts', 'Basic: browse courses, watch free videos, download PDFs'],
        tips: 'Batch code is "2026". Change in StudentLogin.jsx.',
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
        <p className="text-slate-400 text-sm mb-4">Complete guide — search or browse by category</p>
        <input
          className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand transition-all"
          placeholder="Search features..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

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

      <div className="bg-[#111111] rounded-2xl p-5 border border-slate-800 mt-6">
        <h3 className="font-bold text-white mb-3">Quick Reference</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Admin: rbtmissionlearningofficial@gmail.com</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Batch code: 2026</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">All changes sync instantly</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">GitHub: github.com/adiiiii13/rbt</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Firebase Hosting + Netlify</span></div>
          <div className="flex items-start gap-2"><span className="text-green-brand">•</span><span className="text-slate-300">Search bar works on this page</span></div>
        </div>
      </div>
    </div>
  )
}
