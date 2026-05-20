import { useState } from 'react'

const categories = [
  {
    name: 'Content Management',
    features: [
      {
        title: 'Manage Courses',
        icon: '📚',
        what: 'Add, edit, delete courses. Each course has title, description, subjects list, level (Foundation/Intermediate/Competitive), duration, student count, icon, color.',
        where: 'Shows on: Homepage courses section, Courses page, Student dashboard quick view, Basic dashboard.',
        workflow: [
          'Go to Manage Courses → click "+ Add Course"',
          'Fill: title, description, subjects (comma separated), level, duration, students, pick icon + color',
          'Click "Add Course" → appears instantly on all pages',
          'Edit: click Edit → change fields → Update',
          'Delete: click Delete → confirms → removed from all pages',
        ],
        tips: 'Subjects are comma separated: "Physics, Chemistry, Maths". Change color to match your branding.',
      },
      {
        title: 'Manage Videos',
        icon: '🎬',
        what: 'Add videos from YouTube or upload your own video files. Free videos everyone can watch, paid videos require payment.',
        where: 'Shows on: Videos page (free only), Student videos, Basic dashboard.',
        workflow: [
          'Go to Manage Videos → click "+ Add Video"',
          'Choose: "YouTube URL" or "Upload Video"',
          'YouTube: paste any YouTube link (watch, share, embed)',
          'Upload: select video file (MP4, WebM, MOV — warns over 500MB)',
          'Add thumbnail (upload or paste URL)',
          'Fill title, subject, class, duration, teacher',
          'Toggle Free/Paid. If paid: set price in INR',
          'Click "Add Video" → appears on student/public pages instantly',
        ],
        tips: 'YouTube videos auto-embed. Uploaded videos play in native player. Delete All button removes all videos at once.',
      },
      {
        title: 'Manage PDFs',
        icon: '📄',
        what: 'Upload test papers, worksheets, practice materials. Can upload PDF file or paste external link.',
        where: 'Shows on: Test Papers page (public), Student PDFs page, Student dashboard.',
        workflow: [
          'Go to Manage PDFs → click "+ Add PDF"',
          'Upload PDF file (max 50MB) or paste URL (Google Drive, Dropbox)',
          'Fill: title, class, subject, exam type, date',
          'Click "Add PDF" → appears on Test Papers + Student pages',
        ],
        tips: 'For large files (>50MB), upload to Google Drive → make public → paste link.',
      },
      {
        title: 'Manage Gallery',
        icon: '🖼️',
        what: 'Upload campus photos, lab images, event photos.',
        where: 'Shows on: Gallery page (public).',
        workflow: [
          'Go to Manage Gallery → click "+ Add Image"',
          'Upload image (max 5MB) or paste URL',
          'Fill: title, category (Campus/Labs/Events/Facilities/Students)',
          'Click "Add Image" → appears on Gallery page',
        ],
        tips: 'Hover on any image card to see Edit/Delete overlay.',
      },
      {
        title: 'Manage Testimonials',
        icon: '💬',
        what: 'Add student/parent quotes with star ratings.',
        where: 'Shows on: Home page testimonials section.',
        workflow: [
          'Go to Manage Testimonials → click "+ Add"',
          'Fill: name, role (e.g. "JEE Aspirant"), type (student/parent), text, rating (1-5)',
          'Click "Add" → appears on Home page',
        ],
      },
      {
        title: 'Manage Achievements',
        icon: '🏆',
        what: 'Add student results, ranks, exam scores.',
        where: 'Shows on: Achievements page, Student achievements page.',
        workflow: [
          'Go to Manage Achievements → click "+ Add"',
          'Fill: student name, course, result (e.g. "AIR 45"), marks, year, description',
          'Click "Add" → appears on Achievements pages',
        ],
      },
    ],
  },
  {
    name: 'Student Management',
    features: [
      {
        title: 'Manage Students',
        icon: '👨‍🎓',
        what: 'Create student accounts (real Firebase Auth login), edit details, disable/enable login, delete accounts.',
        where: 'Changes take effect immediately. Student can login once account is created.',
        workflow: [
          'Go to Manage Students → click "+ Add Student"',
          'Fill: student ID, name, email, phone, class, course, password (min 8 chars)',
          'Click "Create Student Account" → Cloud Function creates real Auth account',
          'Student can now login with email + password at /student-login',
          'Disable: blocks student from logging in (reversible)',
          'Enable: re-enables login',
          'Delete: permanently removes account + all data (irreversible)',
        ],
        tips: 'Student ID format: "STU001", "BIO123", etc. Password should be shared with student privately.',
      },
      {
        title: 'Counselling Bookings',
        icon: '📅',
        what: 'Student books counselling session → you approve with Google Meet link → student joins from dashboard.',
        where: 'Student sees booking status + meeting link on their dashboard.',
        workflow: [
          'Student fills counselling form → booking appears with "Pending" status',
          'You see it in Counselling Bookings page',
          'Click "Approve" → paste Google Meet link → student gets notified',
          'Student dashboard shows "Join Meeting" button',
          'After session: click "Complete" to mark done',
          'Edit: change topic, date, time, meet link, status',
          'Delete: remove booking permanently',
        ],
        tips: 'Create Meet link at meet.new. Status flow: Pending → Approved → Completed (or Rejected).',
      },
    ],
  },
  {
    name: 'Communication',
    features: [
      {
        title: 'Notices',
        icon: '📢',
        what: 'Publish announcements. Students get FCM push notification on their phones automatically.',
        where: 'Shows on: Student Notices page + push notification to all active students.',
        workflow: [
          'Go to Notices → click "+ Add Notice"',
          'Fill: title, content, priority (high/medium/low), category',
          'Click "Publish Notice"',
          'Push notification auto-sent to all students with FCM token',
          'Student sees notification → taps → opens notices page',
        ],
        tips: 'High priority notices show red dot. Categories: General, Academic, Exam, Holiday, Event, Fee.',
      },
      {
        title: 'Contact Inquiries',
        icon: '📧',
        what: 'Contact form submissions from website visitors.',
        where: 'Shows here with unread badge count.',
        workflow: [
          'Visitor fills contact form on website',
          'Submission appears here with unread badge',
          'Click "View" → see full message details',
          'Click "Mark Read" to clear badge',
          'Click "Reply Email" to open email client',
          'Delete: remove inquiry',
        ],
      },
      {
        title: 'Manage Offers',
        icon: '🎁',
        what: 'Create promotional popups shown to website visitors. Click redirects to WhatsApp with prefilled message.',
        where: 'Shows as popup banner on homepage for all visitors.',
        workflow: [
          'Go to Offers → click "+ Add Offer"',
          'Fill: title, popup message, WhatsApp phone (with country code), prefilled message, bg color',
          'Check "Active" checkbox',
          'Click "Create Offer" → popup appears on homepage',
          'Click Activate/Deactivate toggle to show/hide',
          'Visitor sees popup → clicks "Enquire on WhatsApp" → redirected with message',
          'Dismiss: session only (shows again next session)',
        ],
        tips: 'Only one offer shows at a time (latest active). Phone format: "918888888888" (no + sign).',
      },
    ],
  },
  {
    name: 'Payments',
    features: [
      {
        title: 'Manage Payments',
        icon: '💰',
        what: 'Student pays UPI → payment appears here → you verify → student gets access to paid content.',
        where: 'Student sees payment status + invoice on their dashboard.',
        workflow: [
          'Student clicks locked video → goes to payment page',
          'Student pays via UPI → enters transaction ID',
          'Payment appears here with "Pending" status',
          'Verify: marks as verified → student unlocks content',
          'Reject: marks as rejected → student notified',
          'Revenue total shows verified payments only',
        ],
        tips: 'Invoice number auto-generated. UPI ID set in .env file.',
      },
    ],
  },
  {
    name: 'Help & System',
    features: [
      {
        title: 'Seed Data',
        icon: '🌱',
        what: 'Fills empty collections with demo courses, videos, PDFs, achievements, testimonials. Demo data stays when you add your own.',
        where: 'Available on Dashboard page.',
        workflow: [
          'Go to Dashboard → click "Seed Data"',
          'Demo content added to all empty collections',
          'Your additions live alongside demo data',
          'Delete individual demo items from each manage page',
        ],
        tips: 'Only adds to empty collections. Won\'t overwrite your data.',
      },
      {
        title: 'Batch vs Basic Login',
        icon: '🔐',
        what: 'Two student login types with different access levels.',
        where: 'Student chooses at /student-login.',
        workflow: [
          'Batch Student Login: Google + batch code "2026" → full dashboard (all 10 pages)',
          'Basic Login: Google only → limited dashboard (courses, videos, test series, payment)',
          'Batch students can: counselling, invoices, notices, achievements',
          'Basic students can: browse courses, watch free videos, download PDFs, pay for content',
        ],
        tips: 'Batch code is "2026". Change in StudentLogin.jsx BATCH_CODE constant.',
      },
    ],
  },
]

export default function HelpPage() {
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')

  const filteredCategories = search
    ? categories.map(cat => ({
        ...cat,
        features: cat.features.filter(f =>
          f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.what.toLowerCase().includes(search.toLowerCase()) ||
          f.workflow.some(w => w.toLowerCase().includes(search.toLowerCase()))
        ),
      })).filter(cat => cat.features.length > 0)
    : categories

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Admin Help</h1>
        <p className="text-slate-400 text-sm mb-4">Everything you can do — click any feature for details</p>
        <input
          className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand transition-all"
          placeholder="Search features..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filteredCategories.map((cat, ci) => (
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
                    <div className="px-4 pb-4 space-y-4">
                      {/* Where it shows */}
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Where</p>
                        <p className="text-sm text-slate-300">{f.where}</p>
                      </div>

                      {/* Steps */}
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Steps</p>
                        <ol className="space-y-2">
                          {f.workflow.map((step, j) => (
                            <li key={j} className="text-sm text-slate-300 flex items-start gap-3">
                              <span className="w-5 h-5 rounded-full bg-green-brand/20 text-green-brand text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{j + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Tips */}
                      {f.tips && (
                        <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10">
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
          <div className="flex items-start gap-2">
            <span className="text-green-brand">•</span>
            <span className="text-slate-300">Admin login: rbtmissionlearningofficial@gmail.com</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-brand">•</span>
            <span className="text-slate-300">Batch code: 2026</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-brand">•</span>
            <span className="text-slate-300">Deployed: Firebase Hosting + Netlify</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-brand">•</span>
            <span className="text-slate-300">GitHub: github.com/adiiiii13/rbt</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-brand">•</span>
            <span className="text-slate-300">Project: rbt-website-918b6</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-brand">•</span>
            <span className="text-slate-300">All changes sync instantly via onSnapshot</span>
          </div>
        </div>
      </div>
    </div>
  )
}
