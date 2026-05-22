import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import Modal from '../../components/Modal'
import { TrophyIcon, CheckCircleIcon } from '../../components/Icons'
import { ListSkeleton } from '../../components/ui/Skeleton'

export default function StudentMockResults() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // selected attempt with full breakdown
  const [questions, setQuestions] = useState([]) // loaded questions for selected test

  useEffect(() => {
    if (!user) return
    let alive = true
    const load = async () => {
      try {
        // No orderBy → avoids needing a composite index for (uid + submittedAt).
        // Sort client-side by submittedAt desc.
        const q = query(collection(db, 'mockAttempts'), where('uid', '==', user.uid))
        const snap = await getDocs(q)
        if (!alive) return
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.submittedAt?.toMillis?.() ?? new Date(a.submittedAt || 0).getTime()
            const tb = b.submittedAt?.toMillis?.() ?? new Date(b.submittedAt || 0).getTime()
            return tb - ta
          })
        setAttempts(data)
      } catch (err) {
        console.error('[StudentMockResults]', err)
      } finally { if (alive) setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [user])

  const loadQuestions = async (attempt) => {
    setSelected(attempt)
    try {
      const snap = await getDocs(collection(db, 'mockTests'))
      const test = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(t => t.id === attempt.testId)
      if (test?.questions) {
        setQuestions(test.questions)
      } else {
        setQuestions([])
      }
    } catch { setQuestions([]) }
  }

  const statusColors = {
    completed: 'badge-green',
    'auto-submitted-timeout': 'badge-gold',
    'auto-submitted-cheating': 'badge-red',
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-brand/15 flex items-center justify-center text-green-brand">
          <TrophyIcon size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Results</h1>
          <p className="text-slate-400 text-sm">All mock test attempts with detailed answers</p>
        </div>
      </div>

      {loading ? (
        <div className="py-8"><ListSkeleton count={4} /></div>
      ) : attempts.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl p-8 border border-slate-800 text-center">
          <TrophyIcon size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No test attempts yet</p>
          <p className="text-sm text-slate-500">Take a mock test to see your results here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map(a => (
            <div key={a.id} className="bg-[#111111] rounded-2xl p-5 border border-slate-800 hover:border-green-brand/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{a.testTitle || 'Mock Test'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{a.category} • {a.submittedAt ? new Date(a.submittedAt?.toDate?.() || a.submittedAt).toLocaleDateString('en-IN') : ''}</p>
                </div>
                <span className={`badge ${statusColors[a.status] || 'badge-navy'}`}>{a.status?.replace('auto-submitted-', '')}</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="bg-green-brand/5 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-green-brand">{a.correct}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Correct</p>
                </div>
                <div className="bg-red-500/5 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-red-400">{a.wrong}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Wrong</p>
                </div>
                <div className="bg-slate-500/5 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-slate-400">{a.unattempted}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Skipped</p>
                </div>
                <div className="bg-blue-500/5 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-blue-400">{a.percentage?.toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-400 uppercase">Score</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{a.score}/{a.maxMarks} marks</p>
                <button onClick={() => loadQuestions(a)} className="text-sm text-green-brand font-bold cursor-pointer hover:underline">
                  View Full Results
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Results Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setQuestions([]) }} title={`${selected?.testTitle || 'Test'} — Full Results`} size="lg">
        {selected && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3 p-4 bg-white/5 rounded-xl">
              <div className="text-center"><p className="text-xl font-bold text-green-brand">{selected.correct}</p><p className="text-xs text-slate-400">Correct</p></div>
              <div className="text-center"><p className="text-xl font-bold text-red-400">{selected.wrong}</p><p className="text-xs text-slate-400">Wrong</p></div>
              <div className="text-center"><p className="text-xl font-bold text-slate-400">{selected.unattempted}</p><p className="text-xs text-slate-400">Skipped</p></div>
              <div className="text-center"><p className="text-xl font-bold text-blue-400">{selected.score}/{selected.maxMarks}</p><p className="text-xs text-slate-400">Score</p></div>
            </div>

            {/* Question by Question */}
            {questions.length > 0 ? questions.map((q, idx) => {
              const bk = selected.breakdown?.find(b => b.qid === q.id)
              const userAnswer = bk?.selectedIndex !== undefined ? bk.selectedIndex : null
              const isCorrect = bk?.status === 'correct'
              const isSkipped = !bk || bk.status === 'skipped'

              return (
                <div key={q.id || idx} className={`rounded-xl p-4 border ${isCorrect ? 'bg-green-brand/5 border-green-brand/20' : isSkipped ? 'bg-white/5 border-slate-700' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? 'bg-green-brand/20 text-green-brand' : isSkipped ? 'bg-slate-500/20 text-slate-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isCorrect ? '✓' : isSkipped ? '—' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">Q{idx + 1}. {q.question}</p>
                      {q.imageUrl && (
                        <img src={q.imageUrl} alt="" className="mt-2 max-h-48 rounded border border-slate-700" loading="lazy" />
                      )}
                    </div>
                  </div>
                  <div className="ml-10 space-y-1.5">
                    {q.options?.map((opt, oi) => {
                      const isUserPick = userAnswer === oi
                      const isRight = q.correctIndex === oi
                      let cls = 'text-slate-400'
                      if (isRight) cls = 'text-green-brand font-medium'
                      else if (isUserPick && !isRight) cls = 'text-red-400 line-through'
                      return (
                        <div key={oi} className={`flex items-center gap-2 text-sm ${cls}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isRight ? 'bg-green-brand/20 text-green-brand' : isUserPick ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-500'}`}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span>{opt}</span>
                          {isRight && <span className="text-[10px] text-green-brand font-bold">(Correct)</span>}
                          {isUserPick && !isRight && <span className="text-[10px] text-red-400 font-bold">(Your answer)</span>}
                        </div>
                      )
                    })}
                    {q.explanation && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Explanation</p>
                        <p className="text-xs text-slate-300">{q.explanation}</p>
                      </div>
                    )}
                    {selected.adminRemarks?.[q.id] && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="text-xs font-bold text-amber-400 uppercase mb-1 flex items-center gap-1">💬 Teacher's Remark</p>
                        <p className="text-xs text-amber-100">{selected.adminRemarks[q.id]}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            }) : (
              <p className="text-slate-500 text-center py-4">Question details not available for this attempt.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
