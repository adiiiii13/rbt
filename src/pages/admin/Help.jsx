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
        what: 'Full course builder with modules, pricing variants, and free previews.',
        workflow: [
          'Basic Info: Set title, level, and choose whether it is a Basic Course or specific Batch Course.',
          'Pricing: Add multiple pricing plans (e.g., 3-Months: ₹4999, 6-Months: ₹7999).',
          'Curriculum: Add Modules (like chapters). Inside each module, add Items (Video, PDF, Link, or Text).',
          'Previews: Check "Free preview" on any video/PDF so students can view it without paying.',
        ],
        tips: 'For Videos, paste an Unlisted YouTube URL and the system auto-grabs the thumbnail. For PDFs, paste a Google Drive link to save storage.',
      },
      {
        title: 'Manage Videos',
        icon: '🎬',
        what: 'Upload standalone paid or free videos for students to watch.',
        workflow: [
          'Add Video: Paste a YouTube link or upload an MP4 file.',
          'Set it as Free or Paid. Paid videos require students to pay before watching.',
          'Once paid, the video unlocks in their dashboard.',
        ],
      },
      {
        title: 'Manage PDFs',
        icon: '📄',
        what: 'Upload study notes, worksheets, and test papers.',
        workflow: [
          'Upload a file directly (max 50MB) OR paste a Google Drive link.',
          'Fill in details like class, subject, and description.',
          'Students can instantly download it from their portal.',
        ],
      },
      {
        title: 'Manage Gallery',
        icon: '🖼️',
        what: 'Showcase campus photos grouped by events.',
        workflow: [
          'Bulk Upload: Select multiple images at once to save time.',
          'Categorize: Group photos by event (e.g., "Annual Day 2026").',
          'Drag & Drop: Easily reorder photos just by dragging them.',
        ],
      },
      {
        title: 'Manage Mock Tests',
        icon: '📝',
        what: 'Create MCQ tests with timers and anti-cheat tracking.',
        workflow: [
          'Add Test: Set duration, negative marking, and total marks.',
          'Add Questions: Enter text, options, and explanations.',
          'Students take the test in a locked fullscreen view.',
        ],
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
        what: 'Control student accounts and access levels.',
        workflow: [
          'Add Student: Create accounts manually for them.',
          'Disable Account: Temporarily block login without deleting their data.',
          'Assign Batches: Move students into batches to grant them premium access.',
        ],
      },
      {
        title: 'Counselling Bookings',
        icon: '📅',
        what: 'Manage 1-on-1 sessions requested by students.',
        workflow: [
          'View requests from students.',
          'Approve: Paste a Google Meet link. The student gets notified.',
          'Reject: Provide a reason. The student is asked to pick another time.',
        ],
      },
      {
        title: 'Doubts',
        icon: '❓',
        what: 'Answer student questions directly.',
        workflow: [
          'Student asks a question and attaches an optional photo.',
          'You write a reply from the Doubts dashboard.',
          'The student receives your answer immediately.',
        ],
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
        title: 'Send Notifications',
        icon: '🔔',
        what: 'Send push alerts to specific students or entire classes.',
        workflow: [
          'Select Audience: Pick one student, a whole batch, or everyone.',
          'Write Message: Add a subject and the notification text.',
          'Send: Instantly pings their dashboard bell icon.',
        ],
      },
      {
        title: 'Offers',
        icon: '🎁',
        what: 'Display promotional banners on the homepage.',
        workflow: [
          'Create Offer: Write a catchy title and select a color theme.',
          'Position: Choose if it appears as a popup, top bar, or corner alert.',
          'Activate: Turn it on or off at any time.',
        ],
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
        what: 'Verify manual UPI payments made by students.',
        workflow: [
          'Students paying manually will submit a Transaction ID.',
          'Check your bank/UPI app for the matching Transaction ID.',
          'Click "Verify" in the admin panel to unlock their course.',
        ],
      },
      {
        title: 'Create Invoices',
        icon: '🧾',
        what: 'Manually bill students for offline services.',
        workflow: [
          'Select a student and enter the due amount.',
          'Send: The student gets an invoice in their portal.',
          'Mark as Paid when you receive the cash/transfer.',
        ],
      },
    ],
  }
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
  const [activeTab, setActiveTab] = useState('admin')
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

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Help & Documentation</h1>
        <p className="text-slate-400">Everything you need to know about managing your platform and students.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-[#111111] p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'admin' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          ⚙️ Admin Module
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'student' 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          👨‍🎓 Student Flows
        </button>
      </div>

      {activeTab === 'admin' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Credentials Section */}
          <div className="bg-gradient-to-br from-slate-900 to-black rounded-3xl p-6 sm:p-8 border border-slate-800 mb-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">🔐</div>
              Your Credentials
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admin Login</div>
                <div className="text-white font-mono text-sm">rbtmissionlearningofficial@gmail.com</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admin Domain</div>
                <div className="text-white font-mono text-sm">@rbtmissionlearning.in</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hosting</div>
                <div className="text-white text-sm">Firebase + Hostinger</div>
              </div>
            </div>
          </div>

          {/* Storage saving tip */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl shrink-0 shadow-inner">💡</div>
            <div>
              <h3 className="font-bold text-amber-400 text-lg mb-2">Pro Tip: Save Storage Space</h3>
              <p className="text-sm text-amber-200/80 leading-relaxed mb-3">
                Whenever you add Videos, Gallery photos, or PDF notes, you can <b>paste a URL</b> instead of uploading a file directly to the server. This saves your storage limits!
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-lg bg-black/40 border border-amber-500/20 text-xs text-amber-300">Images: Use imgur.com</span>
                <span className="px-3 py-1 rounded-lg bg-black/40 border border-amber-500/20 text-xs text-amber-300">Videos: Use Unlisted YouTube links</span>
                <span className="px-3 py-1 rounded-lg bg-black/40 border border-amber-500/20 text-xs text-amber-300">PDFs: Paste Google Drive links</span>
              </div>
            </div>
          </div>

          {/* Search & Categories */}
          <div className="bg-[#111111] rounded-3xl p-6 border border-slate-800 mb-8">
            <input
              className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all mb-6 text-lg"
              placeholder="🔍 Search features, workflows..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveCat('all')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCat === 'all' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
                All Features
              </button>
              {categories.map(c => {
                const cc = colorClasses[c.color]
                const active = activeCat === c.id
                return (
                  <button key={c.id} onClick={() => setActiveCat(c.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${active ? `${cc.bg} ${cc.border} ${cc.text} border shadow-lg` : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}>
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feature List */}
          <div className="grid lg:grid-cols-2 gap-6">
            {filtered.map(cat => {
              const cc = colorClasses[cat.color]
              return (
                <div key={cat.id} className="space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4 mt-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${cc.bg} ${cc.text}`}>{cat.icon}</span>
                    {cat.name}
                  </h3>
                  
                  {cat.features.map((f, fi) => {
                    const key = `${cat.id}-${fi}`
                    const isOpen = expanded === key
                    return (
                      <div key={fi} className={`bg-[#111111] rounded-2xl border ${isOpen ? cc.border : 'border-slate-800'} overflow-hidden transition-all duration-300 hover:border-slate-600`}>
                        <button onClick={() => setExpanded(isOpen ? null : key)}
                          className="w-full flex items-center justify-between p-5 text-left cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl drop-shadow-md">{f.icon}</div>
                            <div>
                              <h4 className="font-bold text-white text-lg">{f.title}</h4>
                              <p className="text-sm text-slate-400 mt-1">{f.what}</p>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 bg-white/10' : ''}`}>
                            ↓
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="px-5 pb-5 border-t border-slate-800/50 pt-4 bg-black/20">
                            <div className="mb-4">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">How it works</p>
                              <div className="space-y-3">
                                {f.workflow.map((step, j) => (
                                  <div key={j} className="flex items-start gap-3">
                                    <div className={`w-6 h-6 rounded-full ${cc.bg} ${cc.text} text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold`}>{j + 1}</div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {f.tips && (
                              <div className="mt-4 bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 flex gap-3">
                                <div className="text-xl">💡</div>
                                <p className="text-sm text-blue-200">{f.tips}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
          
          <div className="bg-[#111111] rounded-3xl p-8 border border-slate-800 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-3xl">👋</span> Account Creation & Login
            </h2>
            <p className="text-slate-400 mb-8">How students register and gain access to the platform.</p>

            <div className="relative pl-8 border-l-2 border-slate-800 space-y-8">
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-800 border-4 border-[#111111]"></div>
                <h3 className="font-bold text-white text-lg">1. Student Signs Up</h3>
                <p className="text-slate-400 mt-1">They visit <code className="bg-black px-2 py-0.5 rounded text-green-400 text-sm">/student-signup</code> and create an account with Email or Google.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-800 border-4 border-[#111111]"></div>
                <h3 className="font-bold text-white text-lg">2. Profile Initialization</h3>
                <p className="text-slate-400 mt-1">They are forced to a setup page where they enter their Class, School Name, and Phone Number.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-blue-500 border-4 border-[#111111] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <h3 className="font-bold text-blue-400 text-lg">3. Admin Assigns Batch (Your Job)</h3>
                <p className="text-slate-300 mt-1">You go to <b>Manage Students</b>, find their name, and assign them to a Batch. Once assigned, they instantly get full access to the premium dashboard!</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] rounded-3xl p-8 border border-slate-800 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-3xl">💳</span> Purchasing Courses
            </h2>
            <p className="text-slate-400 mb-8">The complete flow when a student buys a course or video.</p>

            <div className="relative pl-8 border-l-2 border-slate-800 space-y-8">
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-800 border-4 border-[#111111]"></div>
                <h3 className="font-bold text-white text-lg">1. Student Browses</h3>
                <p className="text-slate-400 mt-1">They open <b>Buy Courses</b> on their dashboard and select a package (e.g. 3-Months).</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-800 border-4 border-[#111111]"></div>
                <h3 className="font-bold text-white text-lg">2. Makes Payment</h3>
                <p className="text-slate-400 mt-1">They pay instantly using <b>Razorpay</b>, or they scan a QR code and manually enter their UPI Transaction ID.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-amber-500 border-4 border-[#111111] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                <h3 className="font-bold text-amber-400 text-lg">3. Admin Verifies (If UPI)</h3>
                <p className="text-slate-300 mt-1">If they paid manually, it stays "Pending". You check your bank app, go to <b>Manage Payments</b>, and click <b>Verify</b>.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-green-500 border-4 border-[#111111] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <h3 className="font-bold text-green-400 text-lg">4. Course Unlocks</h3>
                <p className="text-slate-300 mt-1">The course automatically moves to their <b>My Courses</b> tab and all locked lessons become playable!</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] rounded-3xl p-8 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-3xl">📝</span> Mock Tests
            </h2>
            <p className="text-slate-400 mb-8">How exams are taken and graded.</p>

            <div className="relative pl-8 border-l-2 border-slate-800 space-y-8">
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-800 border-4 border-[#111111]"></div>
                <h3 className="font-bold text-white text-lg">1. Taking the Test</h3>
                <p className="text-slate-400 mt-1">Student starts the test. It forces full screen. If they switch tabs 3 times to search Google, the test auto-submits!</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-slate-800 border-4 border-[#111111]"></div>
                <h3 className="font-bold text-white text-lg">2. Auto Grading</h3>
                <p className="text-slate-400 mt-1">Once submitted, the system calculates marks and applies negative marking automatically.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-red-500 border-4 border-[#111111] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                <h3 className="font-bold text-red-400 text-lg">3. Admin Feedback (Optional)</h3>
                <p className="text-slate-300 mt-1">You go to <b>Mock Results</b>, view their answers, and type custom remarks on specific questions they got wrong to help them learn.</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
