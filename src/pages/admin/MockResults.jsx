import { useState, useMemo, useEffect } from 'react';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { deleteDocument, updateDocument } from '../../lib/firebaseHelpers';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import ExportButton from '../../components/ExportButton';

function fmtDuration(sec) {
  if (!sec || sec < 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function fmtDate(ts) {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch { return '—'; }
}

const STATUS_BADGE = {
  'completed': 'bg-green-500/20 text-green-400',
  'auto-submitted-cheating': 'bg-red-500/20 text-red-400',
  'auto-submitted-timeout': 'bg-amber-500/20 text-amber-400',
};

const STATUS_LABEL = {
  'completed': 'Completed',
  'auto-submitted-cheating': 'CHEATING',
  'auto-submitted-timeout': 'Timeout',
};

export default function MockResults() {
  const { data: attempts, loading } = useRealtimeCollection('mockAttempts', {
    orderField: 'submittedAt',
    orderDir: 'desc',
    fallback: [],
  });
  const { data: tests } = useRealtimeCollection('mockTests', { fallback: [] });

  const [testFilter, setTestFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [remarks, setRemarks] = useState({}); // qid -> string, local edit buffer
  const [savingRemarks, setSavingRemarks] = useState(false);

  useEffect(() => {
    if (detail) setRemarks(detail.adminRemarks || {});
    else setRemarks({});
  }, [detail]);

  const saveRemarks = async () => {
    if (!detail) return;
    setSavingRemarks(true);
    try {
      await updateDocument('mockAttempts', detail.id, { adminRemarks: remarks });
      toast.success('Remarks saved — student will see them');
    } catch (err) { toast.error(err.message); }
    finally { setSavingRemarks(false); }
  };

  const filtered = useMemo(() => {
    return attempts.filter(a => {
      if (testFilter !== 'all' && a.testId !== testFilter) return false;
      if (statusFilter === 'cheating' && !a.cheatingFlagged) return false;
      if (statusFilter === 'clean' && a.cheatingFlagged) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${a.studentName || ''} ${a.studentEmail || ''} ${a.testTitle || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [attempts, testFilter, statusFilter, search]);

  // Stats
  const stats = useMemo(() => ({
    total: attempts.length,
    cheating: attempts.filter(a => a.cheatingFlagged).length,
    avgScore: attempts.length
      ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length)
      : 0,
    uniqueStudents: new Set(attempts.map(a => a.uid)).size,
  }), [attempts]);

  // Per-student rollup
  const byStudent = useMemo(() => {
    const map = new Map();
    filtered.forEach(a => {
      const key = a.uid || a.studentEmail || 'anon';
      if (!map.has(key)) {
        map.set(key, {
          uid: a.uid,
          name: a.studentName,
          email: a.studentEmail,
          attempts: [],
          flagged: 0,
        });
      }
      const g = map.get(key);
      g.attempts.push(a);
      if (a.cheatingFlagged) g.flagged++;
    });
    return Array.from(map.values()).sort((a, b) => b.attempts.length - a.attempts.length);
  }, [filtered]);

  const [view, setView] = useState('attempts'); // 'attempts' | 'students'

  const removeAttempt = async (id) => {
    if (!confirm('Delete this attempt? Cannot undo.')) return;
    try {
      await deleteDocument('mockAttempts', id);
      toast.success('Deleted');
      setDetail(null);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Mock Test Results</h1>
          <p className="text-sm text-slate-400">All student attempts with proctoring violations log</p>
        </div>
        <ExportButton data={attempts} filename="mock_attempts" columns={[
          { key: 'studentName', label: 'Student' },
          { key: 'studentEmail', label: 'Email' },
          { key: 'testTitle', label: 'Test' },
          { key: 'score', label: 'Score' },
          { key: 'maxMarks', label: 'Max Marks' },
          { key: 'percentage', label: '%' },
          { key: 'correct', label: 'Correct' },
          { key: 'wrong', label: 'Wrong' },
          { key: 'skipped', label: 'Skipped' },
          { key: 'status', label: 'Status' },
          { key: 'tabSwitches', label: 'Tab Switches' },
          { key: 'duration', label: 'Time Taken (sec)' },
          { key: 'submittedAt', label: 'Submitted At' },
        ]} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-slate-400">Total Attempts</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.uniqueStudents}</div>
          <div className="text-xs text-slate-400">Unique Students</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{stats.avgScore}%</div>
          <div className="text-xs text-slate-400">Avg Score</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-400">{stats.cheating}</div>
          <div className="text-xs text-red-400">Cheating Flagged</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search student or test..."
          className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
        <select value={testFilter} onChange={e => setTestFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
          <option value="all" className="bg-slate-900">All Tests</option>
          {tests.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.title}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
          <option value="all" className="bg-slate-900">All Status</option>
          <option value="cheating" className="bg-slate-900">Cheating only</option>
          <option value="clean" className="bg-slate-900">Clean only</option>
        </select>
        <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <button onClick={() => setView('attempts')}
            className={`px-3 py-2 text-sm ${view === 'attempts' ? 'bg-green-brand text-white' : 'text-slate-400'}`}>
            Attempts
          </button>
          <button onClick={() => setView('students')}
            className={`px-3 py-2 text-sm ${view === 'students' ? 'bg-green-brand text-white' : 'text-slate-400'}`}>
            By Student
          </button>
        </div>
      </div>

      {loading && <div className="py-8"><TableSkeleton /></div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-slate-400">No attempts yet.</p>
        </div>
      )}

      {!loading && view === 'attempts' && filtered.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/30 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Test</th>
                  <th className="text-right p-3">Score</th>
                  <th className="text-right p-3">%</th>
                  <th className="text-right p-3">Time</th>
                  <th className="text-center p-3">Violations</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-right p-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} onClick={() => setDetail(a)}
                    className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${a.cheatingFlagged ? 'bg-red-500/5' : ''}`}>
                    <td className="p-3">
                      <div className="text-white font-medium">{a.studentName || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{a.studentEmail}</div>
                    </td>
                    <td className="p-3 text-slate-300">{a.testTitle}</td>
                    <td className="p-3 text-right text-white font-bold">{a.score}/{a.maxMarks}</td>
                    <td className="p-3 text-right">
                      <span className={a.percentage >= 60 ? 'text-green-400' : a.percentage >= 35 ? 'text-amber-400' : 'text-red-400'}>
                        {a.percentage}%
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs">{fmtDuration(a.timeTaken)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-bold ${a.violations?.length ? 'text-red-400' : 'text-slate-500'}`}>
                        {a.violations?.length || 0}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${STATUS_BADGE[a.status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {STATUS_LABEL[a.status] || a.status || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-xs text-slate-400">{fmtDate(a.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && view === 'students' && byStudent.length > 0 && (
        <div className="space-y-3">
          {byStudent.map(s => {
            const best = Math.max(...s.attempts.map(a => a.percentage || 0));
            const avg = Math.round(s.attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / s.attempts.length);
            return (
              <div key={s.uid || s.email} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-white font-bold">{s.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </div>
                  <div className="flex gap-2">
                    {s.flagged > 0 && (
                      <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded">
                        {s.flagged} flagged
                      </span>
                    )}
                    <span className="bg-white/10 text-slate-300 text-xs px-2 py-1 rounded">
                      {s.attempts.length} attempts
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-black/30 rounded p-2">
                    <div className="text-green-400 font-bold">{best}%</div>
                    <div className="text-[10px] text-slate-500">Best</div>
                  </div>
                  <div className="bg-black/30 rounded p-2">
                    <div className="text-white font-bold">{avg}%</div>
                    <div className="text-[10px] text-slate-500">Avg</div>
                  </div>
                  <div className="bg-black/30 rounded p-2">
                    <div className="text-white font-bold">{s.attempts.length}</div>
                    <div className="text-[10px] text-slate-500">Attempts</div>
                  </div>
                </div>
                <div className="space-y-1">
                  {s.attempts.map(a => (
                    <div key={a.id} onClick={() => setDetail(a)}
                      className="flex justify-between items-center p-2 bg-black/20 hover:bg-black/40 rounded cursor-pointer text-xs">
                      <span className="text-slate-300 truncate flex-1">{a.testTitle}</span>
                      <span className="text-white font-bold mr-3">{a.percentage}%</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_BADGE[a.status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {STATUS_LABEL[a.status] || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)}
        title={detail ? `${detail.studentName || 'Attempt'} — ${detail.testTitle}` : ''}
        size="lg">
        {detail && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Status banner */}
            {detail.cheatingFlagged && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
                <div className="text-red-400 font-bold mb-1">⚠ CHEATING FLAGGED — Auto-Submitted</div>
                <div className="text-xs text-red-300">Student exceeded {detail.violations?.length || 0} proctoring violations.</div>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{detail.score}<span className="text-sm text-slate-500">/{detail.maxMarks}</span></div>
                <div className="text-xs text-slate-500">Score</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{detail.percentage}%</div>
                <div className="text-xs text-slate-500">Percentage</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{fmtDuration(detail.timeTaken)}</div>
                <div className="text-xs text-slate-500">Time Taken</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{detail.violations?.length || 0}</div>
                <div className="text-xs text-slate-500">Violations</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                <div className="text-xl font-bold text-green-400">{detail.correct || 0}</div>
                <div className="text-xs text-green-400">Correct</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                <div className="text-xl font-bold text-red-400">{detail.wrong || 0}</div>
                <div className="text-xs text-red-400">Wrong</div>
              </div>
              <div className="bg-slate-500/10 border border-slate-500/30 rounded p-3">
                <div className="text-xl font-bold text-slate-300">{detail.unattempted || 0}</div>
                <div className="text-xs text-slate-400">Skipped</div>
              </div>
            </div>

            {/* Violations log */}
            {detail.violations?.length > 0 && (
              <div>
                <h4 className="text-white font-bold mb-2 text-sm">Proctoring Violations Log</h4>
                <div className="space-y-1 bg-black/30 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {detail.violations.map((v, i) => (
                    <div key={i} className="flex justify-between text-xs border-b border-white/5 last:border-0 py-1.5">
                      <span className="text-red-400 font-medium">{v.label || v.type}</span>
                      <span className="text-slate-500">{fmtDate(v.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Q+Answer Detail */}
            {(() => {
              const test = tests.find(t => t.id === detail.testId);
              const questions = test?.questions || [];
              if (!questions.length) {
                return (
                  <div>
                    <h4 className="text-white font-bold mb-2 text-sm">Question Detail</h4>
                    <p className="text-xs text-slate-500">Test data unavailable (test may have been deleted).</p>
                  </div>
                );
              }
              return (
                <div>
                  <h4 className="text-white font-bold mb-3 text-sm">Question-by-Question Detail</h4>
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {questions.map((q, idx) => {
                      const bk = detail.breakdown?.find(b => b.qid === q.id);
                      const userAns = bk?.selectedIndex;
                      const isCorrect = bk?.status === 'correct';
                      const isSkipped = !bk || bk.status === 'unattempted' || bk.status === 'skipped';
                      return (
                        <div key={q.id || idx} className={`rounded-lg p-3 border ${
                          isCorrect ? 'bg-green-500/5 border-green-500/30' :
                          isSkipped ? 'bg-slate-500/5 border-slate-700' :
                          'bg-red-500/5 border-red-500/30'
                        }`}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrect ? 'bg-green-500/20 text-green-400' :
                              isSkipped ? 'bg-slate-500/20 text-slate-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {isCorrect ? '✓' : isSkipped ? '—' : '✗'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-white font-medium">Q{idx + 1}. {q.question}</p>
                              {q.imageUrl && (
                                <img src={q.imageUrl} alt="" className="mt-2 max-h-40 rounded border border-white/10" loading="lazy" />
                              )}
                            </div>
                          </div>
                          <div className="ml-8 space-y-1">
                            {q.options?.map((opt, oi) => {
                              const isUserPick = userAns === oi;
                              const isRight = q.correctIndex === oi;
                              let cls = 'text-slate-400';
                              if (isRight) cls = 'text-green-400 font-medium';
                              else if (isUserPick && !isRight) cls = 'text-red-400 line-through';
                              return (
                                <div key={oi} className={`flex items-center gap-2 text-xs ${cls}`}>
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isRight ? 'bg-green-500/20 text-green-400' :
                                    isUserPick ? 'bg-red-500/20 text-red-400' :
                                    'bg-white/5 text-slate-500'
                                  }`}>
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {isRight && <span className="text-[10px] text-green-400 font-bold">(Correct)</span>}
                                  {isUserPick && !isRight && <span className="text-[10px] text-red-400 font-bold">(Picked)</span>}
                                </div>
                              );
                            })}
                            {q.explanation && (
                              <div className="mt-2 p-2 rounded bg-blue-500/5 border border-blue-500/20">
                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Explanation</p>
                                <p className="text-xs text-slate-300">{q.explanation}</p>
                              </div>
                            )}
                            <div className="mt-2">
                              <label className="text-[10px] font-bold text-amber-400 uppercase mb-1 block">Admin remark (visible to student)</label>
                              <textarea
                                value={remarks[q.id] || ''}
                                onChange={e => setRemarks(r => ({ ...r, [q.id]: e.target.value }))}
                                rows={2}
                                placeholder="Personal feedback for this student on this question..."
                                className="w-full bg-amber-500/5 border border-amber-500/30 rounded px-2 py-1.5 text-amber-100 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={saveRemarks} disabled={savingRemarks}
                    className="mt-3 w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-bold py-2 rounded-lg disabled:opacity-50">
                    {savingRemarks ? 'Saving...' : '💬 Save All Remarks → Student'}
                  </button>
                </div>
              );
            })()}

            {/* Meta */}
            <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-white/10">
              <div>Student: <span className="text-slate-300">{detail.studentEmail}</span></div>
              <div>UID: <span className="text-slate-300 font-mono">{detail.uid}</span></div>
              <div>Started: <span className="text-slate-300">{fmtDate(detail.startedAt)}</span></div>
              <div>Submitted: <span className="text-slate-300">{fmtDate(detail.submittedAt)}</span></div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-white/10">
              <button onClick={() => setDetail(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg">Close</button>
              <button onClick={() => removeAttempt(detail.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                Delete Attempt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
