import { useState } from 'react'

const sections = [
  {
    title: 'Dashboard',
    icon: '📊',
    items: [
      'Shows live stats: courses, students, videos, PDFs, notices, payments, bookings',
      'Revenue calculated from verified payments',
      'Seed Data button: fills empty collections with demo content',
    ],
  },
  {
    title: 'Manage Courses',
    icon: '📚',
    items: [
      'Add/edit/delete courses with title, description, subjects, level, duration, students count',
      'Pick icon and color for each course',
      'Appears instantly on Home page + Courses page + Student dashboard',
    ],
  },
  {
    title: 'Manage Videos',
    icon: '🎬',
    items: [
      'Add YouTube video URL → auto-embeds in player',
      'Free videos visible to everyone, paid videos need payment',
      'Thumbnail URL optional (YouTube auto-provides)',
      'Delete All: removes all videos at once',
      'Click video on site → opens dedicated player page',
    ],
  },
  {
    title: 'Manage Test Papers (PDFs)',
    icon: '📄',
    items: [
      'Upload PDF file (max 50MB) → stored in Firebase Storage',
      'Or paste URL (Google Drive, Dropbox link)',
      'Class, subject, exam type for filtering',
      'Shows on Test Papers page + Student PDFs page',
    ],
  },
  {
    title: 'Manage Achievements',
    icon: '🏆',
    items: [
      'Add student achievements: name, course, result, marks, year',
      'Shows on Achievements page + Student dashboard',
    ],
  },
  {
    title: 'Manage Testimonials',
    icon: '💬',
    items: [
      'Add student/parent quotes with rating (1-5 stars)',
      'Shows on Home page testimonials section',
    ],
  },
  {
    title: 'Manage Students',
    icon: '👨‍🎓',
    items: [
      'Create: makes real Firebase Auth account → student can login with password',
      'Edit: update name, email, phone, course, class',
      'Disable: blocks login (student can\'t access dashboard)',
      'Enable: re-enables login',
      'Delete: removes account + all data permanently',
    ],
  },
  {
    title: 'Manage Notices',
    icon: '📢',
    items: [
      'Add notices with title, content, priority (high/medium/low), category',
      'When published → FCM push notification sent to all active students\' phones',
      'Shows on Student Notices page instantly',
    ],
  },
  {
    title: 'Manage Gallery',
    icon: '🖼️',
    items: [
      'Upload image file (max 5MB) → stored in Firebase Storage',
      'Or paste image URL',
      'Shows on Gallery page',
    ],
  },
  {
    title: 'Manage Payments',
    icon: '💰',
    items: [
      'Students pay via UPI → payment appears here with "Pending" status',
      'Verify: marks payment as verified → student gets access to paid video',
      'Reject: marks as rejected',
      'Revenue total shows verified payments only',
    ],
  },
  {
    title: 'Counselling Bookings',
    icon: '📅',
    items: [
      'Student books counselling session → appears here with "Pending" status',
      'Approve: paste Google Meet link → student sees link on their dashboard',
      'Reject: student sees rejected status',
      'Complete: marks session done',
      'Edit: change date, time, topic, meet link',
      'Delete: remove booking',
    ],
  },
  {
    title: 'Manage Offers',
    icon: '🎁',
    items: [
      'Create offer popup shown to website visitors',
      'Set title, message, WhatsApp phone + prefilled message',
      'Active toggle: show/hide popup on main website',
      'Click popup → redirects to WhatsApp with prefilled message',
    ],
  },
  {
    title: 'Contact Inquiries',
    icon: '📧',
    items: [
      'Contact form submissions from website appear here',
      'Unread badge count',
      'View full details, mark read, reply via email, delete',
    ],
  },
]

const workflows = [
  {
    title: 'Student Registration',
    steps: [
      'Admin → Manage Students → + Add Student',
      'Fill name, ID, email, phone, course, password',
      'Click "Create Student Account"',
      'Cloud Function creates Firebase Auth user + sets role:student claim',
      'Student can now login at /student-login with email + password',
    ],
  },
  {
    title: 'Student Pays for Video',
    steps: [
      'Student → Videos → clicks locked video',
      'Redirects to payment page',
      'Student pays UPI → enters transaction ID',
      'Payment appears in Admin → Manage Payments with "Pending"',
      'Admin verifies payment',
      'Student now sees video as unlocked',
    ],
  },
  {
    title: 'Counselling Flow',
    steps: [
      'Student → Counselling → Book Session → fills form',
      'Admin → Counselling Bookings → sees pending booking',
      'Admin creates Google Meet link → clicks Approve + paste link',
      'Student dashboard → sees approved booking with "Join Meeting" button',
    ],
  },
  {
    title: 'Publish Notice + Push',
    steps: [
      'Admin → Notices → + Add Notice → fill content',
      'Click "Publish Notice"',
      'Cloud Function auto-triggers → reads all active students with FCM token',
      'Push notification sent to all student phones',
      'Student clicks notification → opens notices page',
    ],
  },
  {
    title: 'Gallery Image Upload',
    steps: [
      'Admin → Gallery → + Add Image',
      'Click upload area → select image file (max 5MB)',
      'Image uploads to Firebase Storage → URL appears',
      'Click "Add Image"',
      'Image appears on Gallery page instantly',
    ],
  },
  {
    title: 'PDF Upload',
    steps: [
      'Admin → Test Papers / PDFs → + Add PDF',
      'Click upload area → select PDF file (max 50MB)',
      'PDF uploads to Firebase Storage → URL appears',
      'Fill title, class, subject, exam type',
      'Click "Add PDF"',
      'PDF appears on Test Papers page + Student PDFs page',
    ],
  },
]

export default function HelpPage() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Admin Help</h1>
      <p className="text-slate-400 text-sm mb-6">Complete guide to all admin features and workflows</p>

      {/* Features */}
      <h2 className="text-lg font-bold text-white mb-4">Features</h2>
      <div className="space-y-3 mb-8">
        {sections.map((s, i) => (
          <div key={i} className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{s.icon}</span>
                <h3 className="font-bold text-white">{s.title}</h3>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform ${expanded === i ? 'rotate-180' : ''}`}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {expanded === i && (
              <div className="px-4 pb-4">
                <ul className="space-y-2">
                  {s.items.map((item, j) => (
                    <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-green-brand mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Workflows */}
      <h2 className="text-lg font-bold text-white mb-4">Workflows (Step by Step)</h2>
      <div className="space-y-4">
        {workflows.map((w, i) => (
          <div key={i} className="bg-[#111111] rounded-2xl p-5 border border-slate-800">
            <h3 className="font-bold text-white mb-3">{w.title}</h3>
            <ol className="space-y-2">
              {w.steps.map((step, j) => (
                <li key={j} className="text-sm text-slate-300 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-green-brand/20 text-green-brand text-xs flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}
