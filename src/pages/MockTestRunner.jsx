import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useExamGuard } from '../hooks/useExamGuard';
import toast from 'react-hot-toast';

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

const MAX_WARNINGS = 3;

// NTA-style status colors for palette
const STATUS_COLORS = {
  'not-visited': 'bg-slate-500 text-white',
  'not-answered': 'bg-red-500 text-white',
  'answered': 'bg-green-600 text-white',
  'marked': 'bg-purple-600 text-white',
  'answered-marked': 'bg-purple-600 text-white ring-2 ring-green-400',
};

export default function MockTestRunner() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Phase: 'instructions' | 'rules' | 'exam' | 'submitted'
  const [phase, setPhase] = useState('instructions');
  const [agreed, setAgreed] = useState(false);

  const [answers, setAnswers] = useState({}); // {qid: selectedIndex}
  const [marked, setMarked] = useState({});   // {qid: true}
  const [visited, setVisited] = useState({}); // {qid: true}
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submittedRef = useRef(false);
  const testRef = useRef(null);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { testRef.current = test; }, [test]);

  // Exam guard
  const handleForceSubmit = (violationsLog) => {
    if (submittedRef.current) return;
    toast.error(`Test ended — ${MAX_WARNINGS} violations detected`);
    handleSubmit({ cheating: true, violationsOverride: violationsLog });
  };
  const handleWarning = (count, max, entry) => {
    toast.error(`⚠ Warning ${count}/${max}: ${entry.label}`, { duration: 4000 });
  };

  const { violations, warningCount, isFullscreen, enterFullscreen, exitFullscreen } = useExamGuard({
    enabled: phase === 'exam',
    maxWarnings: MAX_WARNINGS,
    onWarning: handleWarning,
    onForceSubmit: handleForceSubmit,
  });

  // Load test
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'mockTests', testId));
        if (!alive) return;
        if (!snap.exists()) { setError('Mock test not found'); setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() };
        if (!data.questions || !data.questions.length) setError('This test has no questions yet.');
        setTest(data);
        setTimeLeft((data.duration || 30) * 60);
        setLoading(false);
      } catch (err) {
        if (!alive) return;
        setError(err.message || 'Failed to load test');
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [testId]);

  // Timer
  useEffect(() => {
    if (phase !== 'exam') return;
    if (timeLeft <= 0) { handleSubmit({ timeOut: true }); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const totalQ = test?.questions?.length || 0;

  const stats = useMemo(() => {
    if (!test?.questions) return { answered: 0, notAnswered: 0, notVisited: 0, marked: 0 };
    let answered = 0, notAnswered = 0, notVisited = 0, markedCount = 0;
    for (const q of test.questions) {
      const hasAns = answers[q.id] !== undefined;
      const isVisited = visited[q.id];
      const isMarked = marked[q.id];
      if (hasAns) answered++;
      else if (isVisited) notAnswered++;
      else notVisited++;
      if (isMarked) markedCount++;
    }
    return { answered, notAnswered, notVisited, marked: markedCount };
  }, [answers, marked, visited, test]);

  const qStatus = (qid) => {
    const hasAns = answers[qid] !== undefined;
    const isMarked = marked[qid];
    const isVisited = visited[qid];
    if (hasAns && isMarked) return 'answered-marked';
    if (hasAns) return 'answered';
    if (isMarked) return 'marked';
    if (isVisited) return 'not-answered';
    return 'not-visited';
  };

  // Mark visited when changing currentQ
  useEffect(() => {
    if (phase !== 'exam' || !test?.questions?.[currentQ]) return;
    const qid = test.questions[currentQ].id;
    setVisited(prev => prev[qid] ? prev : { ...prev, [qid]: true });
  }, [currentQ, phase, test]);

  const handleSelect = (qid, optionIdx) => {
    if (submittedRef.current) return;
    setAnswers(prev => ({ ...prev, [qid]: optionIdx }));
  };

  const handleClear = (qid) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
  };

  const handleToggleMark = (qid) => {
    setMarked(prev => ({ ...prev, [qid]: !prev[qid] }));
  };

  const startExam = async () => {
    if (!agreed) { toast.error('Please agree to the rules first'); return; }
    await enterFullscreen();
    setStartedAt(Date.now());
    setPhase('exam');
  };

  const handleSubmit = async ({ cheating = false, timeOut = false, violationsOverride = null } = {}) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const t = testRef.current;
    const ans = answersRef.current;
    let correct = 0, wrong = 0, unattempted = 0;
    const breakdown = [];
    for (const q of t.questions) {
      const a = ans[q.id];
      if (a === undefined) { unattempted++; breakdown.push({ qid: q.id, status: 'unattempted', selectedIndex: null }); continue; }
      if (a === q.correctIndex) { correct++; breakdown.push({ qid: q.id, status: 'correct', selectedIndex: a }); }
      else { wrong++; breakdown.push({ qid: q.id, status: 'wrong', selectedIndex: a }); }
    }
    const marksPerQ = t.marksPerQuestion ?? 4;
    const negativeMarks = t.negativeMarks ?? 1;
    const score = correct * marksPerQ - wrong * negativeMarks;
    const maxMarks = t.questions.length * marksPerQ;
    const percentage = maxMarks ? (score / maxMarks) * 100 : 0;
    const timeTaken = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const violationsLog = violationsOverride || violations;

    const r = {
      correct, wrong, unattempted, score, maxMarks, percentage, breakdown,
      cheatingFlagged: cheating,
      violations: violationsLog,
      timeTaken,
      status: cheating ? 'auto-submitted-cheating' : (timeOut ? 'auto-submitted-timeout' : 'completed'),
    };
    setResult(r);

    if (user) {
      try {
        await addDoc(collection(db, 'mockAttempts'), {
          testId: t.id,
          testTitle: t.title,
          category: t.category,
          uid: user.uid,
          studentName: user.name || user.email,
          studentEmail: user.email,
          ...r,
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          submittedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[MockTestRunner] save attempt failed:', err.message);
      }
    }

    await exitFullscreen();
    setPhase('submitted');
    setSubmitting(false);
  };

  // ─── Loading / error ───
  if (loading) return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-green-brand rounded-full animate-spin" />
    </div>
  );

  if (error || !test) return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error || 'Test unavailable'}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    </div>
  );

  // ─── Instructions screen ───
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-[#050B14] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/student/test-papers/mock" className="text-slate-400 hover:text-white text-sm no-underline mb-6 inline-block">← Back</Link>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
            <p className="text-slate-400 mb-6">{test.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat label="Questions" value={totalQ} color="text-green-brand" />
              <Stat label="Minutes" value={test.duration || 30} color="text-blue-400" />
              <Stat label="Max Marks" value={totalQ * (test.marksPerQuestion ?? 4)} color="text-amber-400" />
              <Stat label="Negative" value={`-${test.negativeMarks ?? 1}`} color="text-red-400" />
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 mb-6">
              <h3 className="text-amber-400 font-bold mb-3">Marking Scheme</h3>
              <ul className="text-sm text-slate-300 space-y-1.5">
                <li>• <span className="text-green-brand">+{test.marksPerQuestion ?? 4}</span> for correct answer</li>
                <li>• <span className="text-red-400">-{test.negativeMarks ?? 1}</span> for wrong answer</li>
                <li>• <span className="text-slate-400">0</span> for unattempted</li>
              </ul>
            </div>

            <button onClick={() => setPhase('rules')} disabled={totalQ === 0}
              className="w-full bg-green-brand hover:bg-green-600 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl text-lg">
              Continue to Rules →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Rules / system check screen ───
  if (phase === 'rules') {
    return (
      <div className="min-h-screen bg-[#050B14] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 border border-red-500/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Proctored Exam Rules</h2>
                <p className="text-sm text-slate-400">Read carefully before starting</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <Rule num="1" text="Test opens in fullscreen mode. Do not exit fullscreen during the exam." />
              <Rule num="2" text="Do not switch tabs, minimize window, or open other applications." />
              <Rule num="3" text="Right-click, copy/paste, and developer tools are disabled." />
              <Rule num="4" warning text={`You get ${MAX_WARNINGS} warnings only. After 3 violations, the exam auto-submits with a CHEATING FLAG.`} />
              <Rule num="5" text="Timer cannot be paused. If time runs out, test auto-submits." />
              <Rule num="6" text="Do not refresh the page or use browser back button." />
              <Rule num="7" text="Ensure stable internet connection before starting." />
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
              <h4 className="text-blue-400 font-bold text-sm mb-2">Question Palette Legend</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Legend color="bg-green-600" label="Answered" />
                <Legend color="bg-red-500" label="Not Answered" />
                <Legend color="bg-purple-600" label="Marked for Review" />
                <Legend color="bg-slate-500" label="Not Visited" />
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 bg-black/30 border border-white/10 rounded-xl cursor-pointer mb-4">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-green-brand" />
              <span className="text-sm text-slate-300">
                I have read all the rules carefully. I understand that violating any rule will result in warnings and potential cheating flag. I am ready to begin the exam.
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setPhase('instructions')} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl">
                ← Back
              </button>
              <button onClick={startExam} disabled={!agreed}
                className="flex-[2] bg-red-500 hover:bg-red-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-lg">
                I Agree — Start Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Submitted / result screen ───
  if (phase === 'submitted' && result) {
    const passed = result.percentage >= 40 && !result.cheatingFlagged;
    return (
      <div className="min-h-screen bg-[#050B14] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            {result.cheatingFlagged && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-6">
                <h3 className="text-red-400 font-bold mb-1">⚠ Cheating Flag Raised</h3>
                <p className="text-sm text-red-300">
                  {result.violations.length} violations detected during this exam.
                  Test was force-submitted. This attempt has been flagged for admin review.
                </p>
              </div>
            )}

            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              result.cheatingFlagged ? 'bg-red-500/20 text-red-400' :
              passed ? 'bg-green-brand/20 text-green-brand' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {result.cheatingFlagged ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> :
                  passed ? <path d="M20 6 9 17l-5-5"/> : <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></>}
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-white text-center mb-2">
              {result.cheatingFlagged ? 'Test Terminated' : 'Test Submitted'}
            </h2>
            <p className="text-slate-400 text-center mb-8">{test.title}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <ResultStat label="Correct" value={result.correct} color="text-green-brand" bg="bg-green-brand/10" />
              <ResultStat label="Wrong" value={result.wrong} color="text-red-400" bg="bg-red-500/10" />
              <ResultStat label="Skipped" value={result.unattempted} color="text-slate-400" bg="bg-slate-500/10" />
              <ResultStat label="Score %" value={`${result.percentage.toFixed(1)}%`} color="text-blue-400" bg="bg-blue-500/10" />
            </div>

            <div className="bg-white/5 rounded-xl p-6 mb-6 text-center">
              <div className="text-sm text-slate-400 mb-1">Final Score</div>
              <div className="text-5xl font-extrabold text-white">
                {result.score}<span className="text-2xl text-slate-500">/{result.maxMarks}</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">Time taken: {formatTime(result.timeTaken)}</div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/student/test-papers/mock')} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl">
                More Tests
              </button>
              {!result.cheatingFlagged && (
                <button onClick={() => window.location.reload()} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-3 rounded-xl">
                  Retake
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Exam in progress (NTA-style) ───
  const q = test.questions[currentQ];
  const selected = answers[q.id];

  return (
    <div className="min-h-screen bg-slate-100 select-none">
      {/* Top header — NTA-style */}
      <header className="bg-[#0a1628] text-white px-4 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/Images/RBT Logo.jpeg" alt="" className="w-9 h-9 rounded object-cover" />
          <div className="min-w-0">
            <h1 className="font-bold truncate text-sm">{test.title}</h1>
            <p className="text-[10px] text-slate-400">Q {currentQ + 1} of {totalQ}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${
          timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
        }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-3">
          {warningCount > 0 && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-xs px-3 py-1.5 rounded-full font-bold">
              ⚠ {warningCount}/{MAX_WARNINGS}
            </div>
          )}
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold">{user?.name || user?.email}</div>
            <div className="text-[10px] text-slate-400">Candidate</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-brand text-white flex items-center justify-center font-bold">
            {(user?.name || user?.email || '?')[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      {!isFullscreen && phase === 'exam' && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-bold">
          ⚠ Fullscreen exited! Click anywhere to re-enter.
          <button onClick={enterFullscreen} className="ml-3 underline">Re-enter fullscreen</button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-0 min-h-[calc(100vh-56px)]">
        {/* Question pane */}
        <main className="bg-white p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h2 className="text-lg font-bold text-slate-900">Question {currentQ + 1}</h2>
            <div className="text-xs text-slate-500">
              Marks: <span className="text-green-700 font-bold">+{test.marksPerQuestion ?? 4}</span>,
              {' '}<span className="text-red-600 font-bold">-{test.negativeMarks ?? 1}</span>
            </div>
          </div>

          <p className="text-slate-900 text-base md:text-lg leading-relaxed mb-6 whitespace-pre-wrap">
            {q.question}
          </p>

          {q.image && (
            <img src={q.image} alt="" className="max-w-full max-h-64 object-contain mb-6 rounded border border-slate-200" />
          )}

          <div className="space-y-3 mb-auto">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(q.id, idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selected === idx
                    ? 'bg-blue-50 border-blue-500 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold mr-3 text-sm ${
                  selected === idx ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </div>

          {/* NTA-style action bar */}
          <div className="border-t border-slate-200 pt-4 mt-6 flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (selected !== undefined) handleToggleMark(q.id);
                  if (currentQ < totalQ - 1) setCurrentQ(c => c + 1);
                }}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold"
              >
                Mark for Review & Next
              </button>
              <button
                onClick={() => handleClear(q.id)}
                className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold"
              >
                Clear Response
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
                disabled={currentQ === 0}
                className="px-5 py-2 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-sm font-bold"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  if (currentQ < totalQ - 1) setCurrentQ(c => c + 1);
                }}
                disabled={currentQ === totalQ - 1}
                className="px-5 py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold"
              >
                Save & Next →
              </button>
            </div>
          </div>
        </main>

        {/* Right sidebar — palette */}
        <aside className="bg-slate-50 border-l border-slate-200 p-4 flex flex-col">
          {/* Status counts */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <Counter label="Answered" value={stats.answered} bg="bg-green-600" />
            <Counter label="Not Answered" value={stats.notAnswered} bg="bg-red-500" />
            <Counter label="Marked" value={stats.marked} bg="bg-purple-600" />
            <Counter label="Not Visited" value={stats.notVisited} bg="bg-slate-500" />
          </div>

          {/* Palette grid */}
          <div className="bg-white rounded-lg p-3 border border-slate-200 mb-4">
            <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase">Questions</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {test.questions.map((qq, idx) => {
                const status = qStatus(qq.id);
                const isCurrent = idx === currentQ;
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrentQ(idx)}
                    className={`aspect-square rounded text-xs font-bold transition-all ${STATUS_COLORS[status]} ${
                      isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                    }`}
                    title={status.replace('-', ' ')}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm(`Submit test now?\n\nAnswered: ${stats.answered}/${totalQ}\nNot Answered: ${stats.notAnswered}\nMarked: ${stats.marked}\nNot Visited: ${stats.notVisited}`)) {
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="w-full mt-auto bg-red-500 hover:bg-red-600 disabled:bg-slate-400 text-white font-bold py-3 rounded-lg text-sm"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </aside>
      </div>
    </div>
  );
}

// ─── Tiny presentational helpers ───
function Stat({ label, value, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 uppercase mt-1">{label}</div>
    </div>
  );
}

function Rule({ num, text, warning }) {
  return (
    <div className={`flex gap-3 p-3 rounded-lg ${warning ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5'}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
        warning ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-300'
      }`}>{num}</span>
      <p className={`text-sm ${warning ? 'text-red-300 font-medium' : 'text-slate-300'}`}>{text}</p>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded ${color}`} />
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

function ResultStat({ label, value, color, bg }) {
  return (
    <div className={`${bg} border border-white/10 rounded-xl p-4 text-center`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase mt-1">{label}</div>
    </div>
  );
}

function Counter({ label, value, bg }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-2 flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full ${bg} text-white flex items-center justify-center font-bold text-xs`}>
        {value}
      </div>
      <span className="text-slate-700 font-medium">{label}</span>
    </div>
  );
}
