import { useState, useMemo } from 'react'

const categories = [
  {
    id: 'content',
    name: 'Content Management',
    icon: '📚',
    color: 'green',
    features: [
      {
        title: 'Manage Courses',
        icon: '📚',
        what: 'Full course system with pricing variants, video lessons (YouTube), thumbnails, free/paid lessons.',
        workflow: [
          '+ Add Course → fill Basic Info (title, description, subjects comma-separated, level, duration)',
          'Thumbnail: upload image OR paste URL (imgur, postimages) — saves storage. Leave blank to auto-derive from first YouTube lesson.',
          'Pricing tab: add multiple variants (3-month, 6-month) with price, original price, discount, note',
          'Lessons tab: paste YouTube URL (auto-detects ID + thumbnail preview), set title/duration/free toggle',
          'Reorder lessons with up/down arrows',
          'Students see courses on Home + /courses → click → variant picker + lesson player',
        ],
        tips: 'Use Unlisted YouTube videos (not Private) to keep videos hidden from search but playable in your site. Free lessons preview to anyone; paid lessons require enrollment.',
      },
      {
        title: 'Manage Videos',
        icon: '🎬',
        what: 'Standalone paid videos. YouTube URL or self-hosted MP4/HLS. Razorpay or manual UPI purchase.',
        workflow: [
          '+ Add Video → paste YouTube link OR upload file (warns >500MB)',
          'Set thumbnail (auto-derived from YT ID, or upload custom)',
          'Toggle Free / Paid. Paid → set price (INR)',
          'Student clicks paid video → Payment page → Razorpay (instant) OR manual UPI (verify needed)',
          'After payment, access unlocks; appears in /student/videos',
        ],
        tips: 'Razorpay = instant access. Manual UPI = student enters txn ID, admin verifies under Manage Payments.',
      },
      {
        title: 'Manage PDFs',
        icon: '📄',
        what: 'Upload test papers, worksheets, notes. PDF upload or Google Drive paste.',
        workflow: [
          '+ Add PDF → Upload file (max 50MB) OR paste URL (Google Drive auto-converted to direct link)',
          'Fill: title, class, subject, exam type, date, file size, description',
          'Appears on /test-papers downloadable tab + Student PDFs',
          'Edit / Delete from card',
        ],
      },
      {
        title: 'Manage Gallery',
        icon: '🖼️',
        what: 'Campus photos with event bundles, custom categories, bulk upload, drag-drop reorder.',
        workflow: [
          'Filter chips: by Category and by Event (auto-built from images)',
          'Add custom category in chip strip (saved per-browser)',
          'Single: + Add Image → upload/URL + title + category + event',
          'Bulk: 📦 Bulk Upload → pick category + event → select many images → progress bar',
          'Drag card to reorder within view (writes order field)',
          'View bundles by event when filter = All events',
        ],
        tips: 'Group photos by event name (e.g. "Annual Day 2026") to bundle them on the public gallery page.',
      },
      {
        title: 'Testimonials',
        icon: '💬',
        what: 'Student/parent quotes with star ratings (1-5).',
        workflow: ['+ Add → name, role, type, text, rating', 'Shows on Home page testimonials carousel'],
      },
      {
        title: 'Achievements',
        icon: '🏆',
        what: 'Student results, ranks, exam scores. Shows on /achievements + student dashboard.',
        workflow: ['+ Add → student name, course, result, marks, year, description', 'Edit / Delete'],
      },
      {
        title: 'Study Material',
        icon: '📖',
        what: 'Organize study notes by subject/class. Nested folders.',
        workflow: ['+ Add → title, subject, class, URL or file', 'Auto-thumbnail when no image provided', 'Students see on /study-material'],
      },
      {
        title: 'Manage Mock Tests',
        icon: '📝',
        what: 'MCQ tests with images, timer, anti-cheat, negative marking, per-Q explanations.',
        workflow: [
          '+ Add Mock Test → title, subject, duration, marks per Q, negative marking',
          'Add questions: text, 4 options, correct index, explanation, optional image',
          'Reorder questions with arrow buttons (always visible — no hover needed)',
          'Bulk import JSON: [{question, options:[a,b,c,d], correctIndex, explanation, imageUrl}]',
          'Students take in /mock-test/:id (fullscreen + tab-switch detection)',
        ],
        tips: 'After student submits, you can also write per-Q remarks in Mock Results that flow back to the student.',
      },
    ],
  },
  {
    id: 'students',
    name: 'Student Management',
    icon: '👥',
    color: 'blue',
    features: [
      {
        title: 'Manage Students',
        icon: '👨‍🎓',
        what: 'Create real Firebase Auth accounts. Edit, disable, delete.',
        workflow: [
          '+ Add Student → ID, name, email, phone, class, course, password (min 8 chars)',
          'Submit → Cloud Function creates Auth user',
          'Disable blocks login (keeps data). Enable restores access.',
          'Delete removes account + Firestore profile permanently.',
        ],
        tips: 'ID format: STU001. Share password privately with student.',
      },
      {
        title: 'Counselling Bookings',
        icon: '📅',
        what: 'Student books slot → admin approves with Meet link OR rejects with reason. Both notify student.',
        workflow: [
          'Student fills form → booking appears with Pending + Type (Batch / Non-batch)',
          'Approve → paste Google Meet link → student gets notification + link visible',
          'Reject → enter reason → student notified with reason + asked to rebook',
          'Re-open rejected bookings back to pending if changed your mind',
          'Edit any field (date, time, status, meet link). Complete after session.',
        ],
        tips: 'Meet links auto-generate at meet.new. Rejection reason is sent verbatim to student — keep it polite.',
      },
      {
        title: 'Doubts',
        icon: '❓',
        what: 'Students upload doubt + photo. Admin replies.',
        workflow: ['Student → My Doubts → text + optional photo', 'Admin → Doubts → write answer', 'Student sees reply. Status: pending → answered.'],
      },
    ],
  },
  {
    id: 'comms',
    name: 'Communication',
    icon: '📣',
    color: 'amber',
    features: [
      {
        title: 'Notices',
        icon: '📢',
        what: 'Site-wide announcements. Visible on student dashboard.',
        workflow: ['+ Add Notice → title, content, priority, category', 'Publish → shows on /student/notices'],
      },
      {
        title: 'Contact Inquiries',
        icon: '📧',
        what: 'Public contact form submissions.',
        workflow: ['Visitor fills /contact form', 'Appears here with unread badge', 'View, mark read, email reply, delete'],
      },
      {
        title: 'Send Notifications',
        icon: '🔔',
        what: 'Targeted in-app notifications: specific students, whole class, or all.',
        workflow: [
          '+ Send Notification → pick audience: Specific / Class / All',
          'Specific: search + multi-select students (checkboxes). Select-all-shown shortcut.',
          'Class: pick class — auto-built from student records',
          'All: blasts to every student',
          'Write subject + message → Send. One doc per recipient (preserves student-side queries).',
          'List view groups broadcasts by subject + time. Delete clears all copies.',
        ],
        tips: 'Confirms before sending to >50 students. Counter shows exact recipient count before send.',
      },
      {
        title: 'Offers',
        icon: '🎁',
        what: 'Promo banners with 3 styles: gradient, solid, image. Position popup, top bar, or corner.',
        workflow: [
          '+ Add Offer → badge, title, message, CTA text + link',
          'Style: Gradient (2 colors) / Solid (1 color) / Image (background photo)',
          '6 color presets: Green Glow, Sunset, Ocean, Royal, Gold, Mono',
          'Live preview panel shows banner as you edit',
          'Set position, priority (higher shows first), start/end dates',
          'Toggle Active to show/hide. WhatsApp click-through optional.',
        ],
        tips: 'Multiple active offers → highest priority wins. Use start/end dates for time-limited campaigns.',
      },
    ],
  },
  {
    id: 'finance',
    name: 'Payments & Finance',
    icon: '💰',
    color: 'purple',
    features: [
      {
        title: 'Manage Payments',
        icon: '💰',
        what: 'All student video purchases. Razorpay auto-verified; manual UPI needs admin approval.',
        workflow: [
          'Razorpay payments → status "verified" auto (gateway confirmed)',
          'UPI payments → status "pending" → admin reviews txn ID → Verify or Reject',
          'Verify → student unlocks video instantly',
          'Reject → student notified to retry',
        ],
      },
      {
        title: 'Create Invoices',
        icon: '🧾',
        what: 'Bill students for courses/services. Grouped by student. Send + reminder + mark paid.',
        workflow: [
          '+ Create Invoice → search student → fill course, description, amount, due date',
          'Submit → invoice doc + notification sent to student automatically',
          'List grouped by student: see total due + total paid per person',
          'Mark Paid → status updates + student notified',
          'Remind → resend notification without re-creating invoice',
          'View → opens Payment-style invoice preview (printable)',
        ],
        tips: 'Filter by student or status. Student sees invoices in /student/invoices alongside video purchases.',
      },
    ],
  },
  {
    id: 'exam',
    name: 'Exam System',
    icon: '🎯',
    color: 'red',
    features: [
      {
        title: 'Mock Tests (Student)',
        icon: '🎯',
        what: 'Timed proctored MCQs. Fullscreen + tab-switch detection + auto-submit on cheat.',
        workflow: ['Test Papers → Mock Tests → start', 'Fullscreen + timer countdown', '3 tab switches → auto-submit', 'Submit → score breakdown'],
      },
      {
        title: 'Mock Results (Student)',
        icon: '🏅',
        what: 'Past attempts with full Q-by-Q review + admin remarks.',
        workflow: [
          'My Results → list of attempts with correct/wrong/skipped + %',
          'View Full Results → modal shows every Q',
          'Shows: question + image, options, your answer (red if wrong), correct answer (green), explanation',
          'Admin remark per Q displays in amber box',
        ],
      },
      {
        title: 'Mock Results (Admin)',
        icon: '📊',
        what: 'All student attempts. Per-Q remarks editor.',
        workflow: [
          'Mock Results → filter by test/student/status',
          'View any attempt → see student answers Q by Q',
          'Write per-Q remark (amber textarea) → Save All Remarks',
          'Student sees your remarks in their results view',
        ],
        tips: 'Use remarks to explain common mistakes, point to study material, or congratulate.',
      },
    ],
  },
  {
    id: 'system',
    name: 'System & Settings',
    icon: '⚙️',
    color: 'slate',
    features: [
      {
        title: 'Seed Data',
        icon: '🌱',
        what: 'One-click demo content for empty collections.',
        workflow: ['Dashboard → Seed Data → fills only empty collections', 'Delete demo items individually from each page'],
      },
      {
        title: 'Batch vs Basic Login',
        icon: '🔐',
        what: 'Two student tiers. Batch = full access, Basic = browse-only.',
        workflow: [
          'Batch: Google sign-in + code "2026" → 11 dashboard pages',
          'Basic: Google only → courses, free videos, PDFs, payments',
          'Batch-only: counselling, invoices, notices, achievements, doubts, mock results',
        ],
      },
      {
        title: 'Firebase Storage',
        icon: '📁',
        what: 'Path layout for uploads.',
        workflow: ['Gallery: public/gallery/', 'PDFs: pdfs/', 'Offers: public/offers/', 'Videos + thumbnails: videos/', 'Doubt photos: doubts/{uid}/', 'Mock test images: mock-tests/images/'],
      },
      {
        title: 'Video Player',
        icon: '🎬',
        what: 'Unified HlsPlayer: YouTube iframe, MP4 native, HLS via react-player.',
        workflow: ['YouTube URL → iframe embed (works for unlisted)', 'Uploaded MP4 → HTML5 video', '.m3u8 → HLS playback'],
      },
    ],
  },
]

const colorClasses = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300' },
}

export default function HelpPage() {
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')

  const filtered = useMemo(() => {
    let cats = categories
    if (activeCat !== 'all') cats = cats.filter(c => c.id === activeCat)
    if (search) {
      const q = search.toLowerCase()
      cats = cats.map(c => ({
        ...c,
        features: c.features.filter(f =>
          f.title.toLowerCase().includes(q) ||
          f.what.toLowerCase().includes(q) ||
          f.workflow.some(w => w.toLowerCase().includes(q)) ||
          (f.tips || '').toLowerCase().includes(q)
        )
      })).filter(c => c.features.length > 0)
    }
    return cats
  }, [search, activeCat])

  const totalFeatures = categories.reduce((s, c) => s + c.features.length, 0)
  const totalMatches = filtered.reduce((s, c) => s + c.features.length, 0)

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-500/10 via-blue-500/5 to-purple-500/10 rounded-3xl p-6 sm:p-8 border border-slate-800 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-green-brand/20 flex items-center justify-center text-2xl shrink-0">📋</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Admin Help Center</h1>
            <p className="text-slate-400 text-sm">{totalFeatures} features across {categories.length} categories — full workflow + tips for everything.</p>
          </div>
        </div>
        <input
          className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-brand transition-all"
          placeholder="🔍 Search features, workflows, tips..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <p className="text-xs text-slate-500 mt-2">{totalMatches} match{totalMatches !== 1 ? 'es' : ''} for "{search}"</p>
        )}
      </div>

      {/* Storage savings tip — top banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl shrink-0">💾</div>
        <div className="flex-1">
          <h3 className="font-bold text-amber-300 text-sm mb-1">Save Firebase Storage — Paste URLs Instead of Uploading</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every upload form (Doubts, Gallery, Offers, Videos, PDFs, Course thumbnails, Study Material) has <b>two options</b>: click to upload <b>OR</b> paste an image / video URL. URLs cost <b>zero storage</b>.
          </p>
          <ul className="text-xs text-slate-400 mt-2 space-y-1 list-disc list-inside">
            <li><b>Images</b> → upload to <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline hover:text-amber-200">imgur.com</a> or <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline hover:text-amber-200">postimages.org</a> → copy direct link → paste</li>
            <li><b>Videos</b> → upload to YouTube as <b>Unlisted</b> → paste link (best — also playable in app)</li>
            <li><b>PDFs</b> → upload to Google Drive → set Anyone-with-link → paste (auto-converted to direct link)</li>
          </ul>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setActiveCat('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCat === 'all' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
          All ({totalFeatures})
        </button>
        {categories.map(c => {
          const cc = colorClasses[c.color]
          const active = activeCat === c.id
          return (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${active ? `${cc.bg} ${cc.border} ${cc.text} border` : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
              <span>{c.icon}</span>
              <span>{c.name}</span>
              <span className="text-xs opacity-60">({c.features.length})</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-[#111111] rounded-2xl p-12 border border-slate-800 text-center">
          <p className="text-slate-500 mb-2">No features match "{search}"</p>
          <button onClick={() => { setSearch(''); setActiveCat('all') }} className="text-sm text-green-brand hover:underline">Clear filters</button>
        </div>
      )}

      {filtered.map(cat => {
        const cc = colorClasses[cat.color]
        return (
          <div key={cat.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${cc.bg} ${cc.border} border flex items-center justify-center text-xl`}>{cat.icon}</div>
              <div>
                <h2 className="text-lg font-bold text-white">{cat.name}</h2>
                <p className="text-xs text-slate-500">{cat.features.length} feature{cat.features.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="space-y-3">
              {cat.features.map((f, fi) => {
                const key = `${cat.id}-${fi}`
                const isOpen = expanded === key
                return (
                  <div key={fi} className={`bg-[#111111] rounded-2xl border ${isOpen ? cc.border : 'border-slate-800'} overflow-hidden transition-colors`}>
                    <button onClick={() => setExpanded(isOpen ? null : key)}
                      className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{f.icon}</span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white truncate">{f.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{f.what}</p>
                        </div>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`text-slate-400 transition-transform shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-slate-800 pt-4">
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">What it does</p>
                          <p className="text-sm text-slate-300">{f.what}</p>
                        </div>
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workflow ({f.workflow.length} steps)</p>
                          <ol className="space-y-2">{f.workflow.map((step, j) => (
                            <li key={j} className="text-sm text-slate-300 flex items-start gap-3">
                              <span className={`w-6 h-6 rounded-full ${cc.bg} ${cc.text} text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold border ${cc.border}`}>{j + 1}</span>
                              <span className="flex-1">{step}</span>
                            </li>
                          ))}</ol>
                        </div>
                        {f.tips && (
                          <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/20">
                            <p className="text-xs font-bold text-amber-400 uppercase mb-1 flex items-center gap-1.5">💡 Pro Tip</p>
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
        )
      })}

      {/* Quick reference footer */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111111] rounded-3xl p-6 border border-slate-800 mt-8">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Reference
        </h3>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Ref label="Admin login" value="rbtmissionlearningofficial@gmail.com" />
          <Ref label="Batch code" value="2026" />
          <Ref label="Admin domain" value="@rbtmission.com" />
          <Ref label="Hosting" value="Firebase + Hostinger Git auto-deploy" />
          <Ref label="GitHub" value="rbtmission/rbtmissionlearning" />
          <Ref label="Realtime" value="Firestore onSnapshot (instant sync)" />
          <Ref label="Storage upload limit" value="5MB (images), 50MB (PDFs), 500MB (videos warn)" />
          <Ref label="YouTube tip" value="Use Unlisted (not Private) for site-only videos" />
        </div>
      </div>

      <div className="bg-[#111111] rounded-2xl p-5 border border-slate-800 mt-4 text-center">
        <p className="text-xs text-slate-500">Need help? Contact dev support — most issues fixable in &lt;5 min via this admin panel.</p>
      </div>
    </div>
  )
}

function Ref({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-green-brand mt-0.5">▸</span>
      <div className="flex-1">
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-slate-200 text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}
