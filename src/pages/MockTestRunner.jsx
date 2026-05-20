import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}

export default function MockTestRunner() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);

  // Load test
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'mockTests', testId));
        if (!alive) return;
        if (!snap.exists()) { setError('Mock test not found'); setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() };
        if (!data.questions || !data.questions.length) {
          setError('This test has no questions configured yet.');
        }
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
    if (!started || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, timeLeft, submitted]);

  const totalQ = test?.questions?.length || 0;

  const stats = useMemo(() => {
    if (!test?.questions) return { attempted: 0, unattempted: 0 };
    let attempted = 0;
    for (const q of test.questions) if (answers[q.id] !== undefined) attempted++;
    return { attempted, unattempted: totalQ - attempted };
  }, [answers, test, totalQ]);

  const handleSelect = (qid, optionIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qid]: optionIdx }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    let correct = 0, wrong = 0, unattempted = 0;
    const breakdown = [];
    for (const q of test.questions) {
      const ans = answers[q.id];
      if (ans === undefined) { unattempted++; breakdown.push({ qid: q.id, status: 'unattempted' }); continue; }
      if (ans === q.correctIndex) { correct++; breakdown.push({ qid: q.id, status: 'correct' }); }
      else { wrong++; breakdown.push({ qid: q.id, status: 'wrong' }); }
    }
    const marksPerQ = test.marksPerQuestion ?? 4;
    const negativeMarks = test.negativeMarks ?? 1;
    const score = correct * marksPerQ - wrong * negativeMarks;
    const maxMarks = totalQ * marksPerQ;
    const percentage = maxMarks ? (score / maxMarks) * 100 : 0;
    const r = { correct, wrong, unattempted, score, maxMarks, percentage, breakdown };
    setResult(r);

    // Save attempt
    if (user) {
      try {
        await addDoc(collection(db, 'mockAttempts'), {
          testId: test.id,
          testTitle: test.title,
          category: test.category,
          uid: user.uid,
          studentName: user.name || user.email,
          ...r,
          submittedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[MockTestRunner] save attempt failed:', err.message);
      }
    }
  };

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
  if (!started) {
    return (
      <div className="min-h-screen bg-[#050B14] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/student/test-papers/mock" className="text-slate-400 hover:text-white text-sm no-underline mb-6 inline-block">
            ← Back
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
            <p className="text-slate-400 mb-6">{test.description}</p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-brand">{totalQ}</div>
                <div className="text-xs text-slate-500 uppercase mt-1">Questions</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{test.duration || 30}</div>
                <div className="text-xs text-slate-500 uppercase mt-1">Minutes</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{totalQ * (test.marksPerQuestion ?? 4)}</div>
                <div className="text-xs text-slate-500 uppercase mt-1">Max Marks</div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
              <h3 className="text-amber-400 font-bold mb-2 text-sm">Instructions</h3>
              <ul className="text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                <li>+{test.marksPerQuestion ?? 4} for correct, -{test.negativeMarks ?? 1} for wrong, 0 for unattempted.</li>
                <li>Timer starts when you click Begin. Auto-submits when time runs out.</li>
                <li>You can change answers any time before submission.</li>
                <li>Do not refresh the page — progress not saved across reloads.</li>
              </ul>
            </div>

            <button
              onClick={() => { setStarted(true); }}
              disabled={totalQ === 0}
              className="w-full bg-green-brand hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all text-lg"
            >
              Begin Test
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Result screen ───
  if (submitted && result) {
    const passed = result.percentage >= 40;
    return (
      <div className="min-h-screen bg-[#050B14] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-green-brand/20 text-green-brand' : 'bg-red-500/20 text-red-400'}`}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {passed ? <path d="M20 6 9 17l-5-5"/> : <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-white text-center mb-2">Test Submitted</h2>
            <p className="text-slate-400 text-center mb-8">{test.title}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="bg-green-brand/10 border border-green-brand/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-brand">{result.correct}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">Correct</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{result.wrong}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">Wrong</div>
              </div>
              <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-400">{result.unattempted}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">Skipped</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{result.percentage.toFixed(1)}%</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">Score</div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6 mb-6 text-center">
              <div className="text-sm text-slate-400 mb-1">Final Score</div>
              <div className="text-5xl font-extrabold text-white">
                {result.score}<span className="text-2xl text-slate-500">/{result.maxMarks}</span>
              </div>
            </div>

            <details className="bg-white/5 rounded-xl p-4 mb-6">
              <summary className="text-white font-bold cursor-pointer">Review answers ({totalQ})</summary>
              <div className="mt-4 space-y-3">
                {test.questions.map((q, i) => {
                  const userAns = answers[q.id];
                  const isCorrect = userAns === q.correctIndex;
                  return (
                    <div key={q.id} className="bg-black/30 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs text-slate-500">Q{i + 1}.</span>
                        <p className="text-sm text-white flex-1">{q.question}</p>
                      </div>
                      <div className="space-y-1.5 ml-6">
                        {q.options.map((opt, oi) => {
                          const isUserAns = userAns === oi;
                          const isRight = q.correctIndex === oi;
                          return (
                            <div key={oi} className={`text-xs px-3 py-1.5 rounded border ${
                              isRight ? 'bg-green-brand/10 border-green-brand/30 text-green-brand' :
                              isUserAns ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                              'border-white/5 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + oi)}. {opt}
                              {isRight && ' ✓'}
                              {isUserAns && !isRight && ' ✗'}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-slate-400 mt-3 ml-6 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>

            <div className="flex gap-3">
              <button onClick={() => navigate('/student/test-papers/mock')} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all">
                More Tests
              </button>
              <button onClick={() => window.location.reload()} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all">
                Retake
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Test in progress ───
  const q = test.questions[currentQ];
  const selected = answers[q.id];

  return (
    <div className="min-h-screen bg-[#050B14]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-white font-bold truncate">{test.title}</h1>
            <p className="text-xs text-slate-400">Question {currentQ + 1} of {totalQ}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Question panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
          >
            <div className="text-xs text-green-brand font-bold mb-3">Question {currentQ + 1}</div>
            <p className="text-white text-lg leading-relaxed mb-6 whitespace-pre-wrap">{q.question}</p>

            <div className="space-y-3 mb-8">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(q.id, idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected === idx
                      ? 'bg-green-brand/15 border-green-brand text-white'
                      : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="inline-block w-8 h-8 rounded-full bg-white/10 text-center leading-8 font-bold mr-3 text-sm">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
                disabled={currentQ === 0}
                className="px-5 py-2.5 rounded-lg bg-white/5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
              >
                ← Previous
              </button>
              {currentQ < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQ(c => Math.min(totalQ - 1, c + 1))}
                  className="px-5 py-2.5 rounded-lg bg-green-brand hover:bg-green-600 text-white font-bold transition-all"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm(`Submit test?\n\nAttempted: ${stats.attempted}/${totalQ}\nUnattempted: ${stats.unattempted}`)) {
                      handleSubmit();
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all"
                >
                  Submit Test
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Sidebar — question palette */}
        <aside className="bg-white/5 border border-white/10 rounded-2xl p-5 h-fit lg:sticky lg:top-24">
          <div className="text-xs text-slate-400 uppercase mb-3 font-bold">Progress</div>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
            <div className="bg-green-brand/15 rounded-lg py-2">
              <div className="text-green-brand font-bold">{stats.attempted}</div>
              <div className="text-slate-400">Done</div>
            </div>
            <div className="bg-slate-500/15 rounded-lg py-2">
              <div className="text-slate-300 font-bold">{stats.unattempted}</div>
              <div className="text-slate-400">Left</div>
            </div>
            <div className="bg-blue-500/15 rounded-lg py-2">
              <div className="text-blue-400 font-bold">{totalQ}</div>
              <div className="text-slate-400">Total</div>
            </div>
          </div>

          <div className="text-xs text-slate-400 uppercase mb-2 font-bold">Questions</div>
          <div className="grid grid-cols-5 gap-1.5">
            {test.questions.map((qq, idx) => {
              const isAnswered = answers[qq.id] !== undefined;
              const isCurrent = idx === currentQ;
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrentQ(idx)}
                  className={`aspect-square rounded-md text-xs font-bold transition-all ${
                    isCurrent ? 'ring-2 ring-white' : ''
                  } ${
                    isAnswered ? 'bg-green-brand text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (confirm(`Submit test?\n\nAttempted: ${stats.attempted}/${totalQ}\nUnattempted: ${stats.unattempted}`)) {
                handleSubmit();
              }
            }}
            className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg transition-all text-sm"
          >
            Submit Test
          </button>
        </aside>
      </div>
    </div>
  );
}
