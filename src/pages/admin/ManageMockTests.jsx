import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState, useMemo } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, deleteDocument, uploadFile } from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import ExportButton from '../../components/ExportButton';

const CATEGORIES = [
  { id: 'jee-main', label: 'JEE Main' },
  { id: 'neet', label: 'NEET' },
  { id: 'class-8', label: 'Class 8' },
  { id: 'class-9', label: 'Class 9' },
  { id: 'class-10', label: 'Class 10' },
  { id: 'class-11', label: 'Class 11' },
  { id: 'class-12', label: 'Class 12' },
  { id: 'boards', label: 'Boards' },
];

const emptyForm = {
  title: '',
  description: '',
  category: 'jee-main',
  difficulty: 'Medium',
  duration: 30,
  marksPerQuestion: 4,
  negativeMarks: 1,
  price: 0,
  questions: [],
};

const emptyQ = () => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  section: 'Physics',
  question: '',
  imageUrl: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  marks: null, // null = use test default
  explanation: '',
});

function isQComplete(q) {
  return q.question.trim() && q.options.every(o => o.trim());
}

export default function ManageMockTests() {
  const { data: tests, loading } = useRealtimeCollection('mockTests', { fallback: [] });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [jsonModal, setJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e, qIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only images allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)');
      return;
    }
    setUploading(true);
    try {
      const path = `mockTestImages/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const url = await uploadFile(path, file);
      updateQ(qIdx, { imageUrl: url });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filtered = filter === 'all' ? tests : tests.filter(t => t.category === filter);
  const activeQ = form.questions[activeQIdx];

  const sections = useMemo(() => {
    const set = new Set(form.questions.map(q => q.section).filter(Boolean));
    return Array.from(set);
  }, [form.questions]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setActiveQIdx(0); setModal(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      title: t.title || '',
      description: t.description || '',
      category: t.category || 'jee-main',
      difficulty: t.difficulty || 'Medium',
      duration: t.duration || 30,
      marksPerQuestion: t.marksPerQuestion ?? 4,
      negativeMarks: t.negativeMarks ?? 1,
      price: t.price ?? 0,
      questions: (t.questions || []).map(q => ({
        section: 'Physics',
        imageUrl: '',
        marks: null,
        explanation: '',
        ...q,
      })),
    });
    setActiveQIdx(0);
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); setActiveQIdx(0); };

  const addQuestion = () => {
    setForm(f => ({ ...f, questions: [...f.questions, emptyQ()] }));
    setActiveQIdx(form.questions.length);
  };
  const removeQuestion = (idx) => {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
    setActiveQIdx(Math.max(0, idx - 1));
  };
  const dupQuestion = (idx) => {
    setForm(f => {
      const next = [...f.questions];
      next.splice(idx + 1, 0, { ...f.questions[idx], id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` });
      return { ...f, questions: next };
    });
  };
  const moveQ = (idx, dir) => {
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= form.questions.length) return;
    setForm(f => {
      const next = [...f.questions];
      [next[idx], next[tgt]] = [next[tgt], next[idx]];
      return { ...f, questions: next };
    });
    setActiveQIdx(cur => cur === idx ? tgt : cur === tgt ? idx : cur);
  };
  const updateQ = (idx, patch) => setForm(f => ({
    ...f,
    questions: f.questions.map((q, i) => i === idx ? { ...q, ...patch } : q),
  }));
  const updateOpt = (qIdx, oIdx, val) => setForm(f => ({
    ...f,
    questions: f.questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? val : o) } : q),
  }));

  const bulkImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('Must be array');
      const qs = parsed.map(p => ({
        ...emptyQ(),
        section: p.section || 'Physics',
        question: p.question || '',
        imageUrl: p.imageUrl || '',
        options: Array.isArray(p.options) && p.options.length === 4 ? p.options : ['', '', '', ''],
        correctIndex: typeof p.correctIndex === 'number' ? p.correctIndex : 0,
        explanation: p.explanation || '',
      }));
      setForm(f => ({ ...f, questions: [...f.questions, ...qs] }));
      toast.success(`Imported ${qs.length} questions`);
      setJsonModal(false);
      setJsonText('');
    } catch (err) {
      toast.error('Invalid JSON: ' + err.message);
    }
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    if (!form.questions.length) { toast.error('Add at least one question'); return; }
    for (const [i, q] of form.questions.entries()) {
      if (!q.question.trim()) { toast.error(`Q${i + 1}: question text missing`); return; }
      if (q.options.some(o => !o.trim())) { toast.error(`Q${i + 1}: all 4 options needed`); return; }
    }
    const payload = {
      ...form,
      duration: Number(form.duration) || 30,
      marksPerQuestion: Number(form.marksPerQuestion) || 4,
      negativeMarks: Number(form.negativeMarks) || 0,
      price: Number(form.price) || 0,
      totalQuestions: form.questions.length,
      maxMarks: form.questions.reduce((s, q) => s + (Number(q.marks) || Number(form.marksPerQuestion) || 4), 0),
    };
    try {
      if (editing) {
        await updateDocument('mockTests', editing.id, payload);
        toast.success('Updated');
      } else {
        await addDocument('mockTests', payload);
        toast.success('Created');
      }
      closeModal();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete test?')) return;
    try {
      await deleteDocument('mockTests', id);
      toast.success('Deleted');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Mock Tests</h1>
          <p className="text-sm text-slate-400">NTA-style proctored MCQ tests</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={tests} filename="mock_tests" columns={[
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'difficulty', label: 'Difficulty' },
            { key: 'duration', label: 'Duration (min)' },
            { key: 'totalQuestions', label: 'Questions' },
            { key: 'maxMarks', label: 'Max Marks' },
            { key: 'marksPerQuestion', label: 'Marks per Q' },
            { key: 'negativeMarks', label: 'Negative Marks' },
            { key: 'description', label: 'Description' },
          ]} />
          <button onClick={openCreate} className="bg-green-brand hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg">
            + New Test
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === 'all' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}
        >
          All ({tests.length})
        </button>
        {CATEGORIES.map(c => {
          const count = tests.filter(t => t.category === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === c.id ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {loading && <TableSkeleton />}

      {!loading && filtered.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-4">No mock tests yet.</p>
          <button onClick={openCreate} className="bg-green-brand hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg">
            Create First Test
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold px-2 py-1 rounded bg-green-brand/10 text-green-brand">
                {CATEGORIES.find(c => c.id === t.category)?.label || t.category}
              </span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${t.price > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                {t.price > 0 ? `₹${t.price}` : 'Free'}
              </span>
            </div>
            <h3 className="text-white font-bold mb-1 line-clamp-2">{t.title}</h3>
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{t.description}</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div className="bg-black/30 rounded p-2">
                <div className="text-white font-bold">{t.questions?.length || 0}</div>
                <div className="text-slate-500 text-[10px]">Q's</div>
              </div>
              <div className="bg-black/30 rounded p-2">
                <div className="text-white font-bold">{t.duration || 30}</div>
                <div className="text-slate-500 text-[10px]">Mins</div>
              </div>
              <div className="bg-black/30 rounded p-2">
                <div className="text-white font-bold">{t.maxMarks ?? (t.questions?.length || 0) * (t.marksPerQuestion ?? 4)}</div>
                <div className="text-slate-500 text-[10px]">Marks</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(t)} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded">Edit</button>
              <button onClick={() => remove(t.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm py-2 px-3 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Mock Test' : 'New Mock Test'} size="full">
        <div className="flex flex-col h-[80vh]">
          {/* Test meta strip */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pb-3 border-b border-white/10">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Test title"
              className="md:col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>)}
            </select>
            <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
              placeholder="Min" title="Duration (min)"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            <input type="number" value={form.marksPerQuestion} onChange={e => setForm({ ...form, marksPerQuestion: e.target.value })}
              placeholder="Marks/Q" title="Marks per Q"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            <input type="number" value={form.negativeMarks} onChange={e => setForm({ ...form, negativeMarks: e.target.value })}
              placeholder="-ve" title="Negative marks"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="₹ Price (0=free)" title="Price in INR (0 = free)"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          {/* Split layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Q list */}
            <div className="w-72 border-r border-white/10 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-white/10 flex gap-2">
                <button onClick={addQuestion} className="flex-1 bg-green-brand hover:bg-green-600 text-white text-xs font-bold py-2 rounded">
                  + Add Q
                </button>
                <button onClick={() => setJsonModal(true)} title="Bulk import JSON"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 rounded">
                  JSON
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {form.questions.map((q, i) => {
                  const complete = isQComplete(q);
                  const active = i === activeQIdx;
                  const stop = (fn) => (e) => { e.stopPropagation(); e.preventDefault(); fn(); };
                  return (
                    <div key={q.id}
                      role="button"
                      onClick={() => setActiveQIdx(i)}
                      className={`p-2 rounded cursor-pointer border ${active ? 'bg-green-brand/20 border-green-brand' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                      <div className="flex items-center gap-2 min-w-0 mb-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className="text-xs text-white font-bold flex-shrink-0">Q{i + 1}</span>
                        <span className="text-[10px] text-slate-400 truncate flex-1">{q.question || '(empty)'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 truncate">{q.section}</span>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <button type="button" onClick={stop(() => moveQ(i, -1))} disabled={i === 0} title="Move up"
                            className="text-xs text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent w-6 h-6 rounded flex items-center justify-center">↑</button>
                          <button type="button" onClick={stop(() => moveQ(i, 1))} disabled={i === form.questions.length - 1} title="Move down"
                            className="text-xs text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent w-6 h-6 rounded flex items-center justify-center">↓</button>
                          <button type="button" onClick={stop(() => dupQuestion(i))} title="Duplicate"
                            className="text-xs text-slate-300 hover:text-white hover:bg-white/10 w-6 h-6 rounded flex items-center justify-center">⎘</button>
                          <button type="button" onClick={stop(() => { if (confirm(`Delete Q${i + 1}?`)) removeQuestion(i); })} title="Delete"
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 w-6 h-6 rounded flex items-center justify-center">×</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {form.questions.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-6">No questions yet</p>
                )}
              </div>
              <div className="p-2 border-t border-white/10 text-[10px] text-slate-400 grid grid-cols-2 gap-2">
                <div>Total: <span className="text-white font-bold">{form.questions.length}</span></div>
                <div>Done: <span className="text-green-400 font-bold">{form.questions.filter(isQComplete).length}</span></div>
              </div>
            </div>

            {/* Right: active Q editor */}
            <div className="flex-1 overflow-y-auto p-5">
              {!activeQ && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-slate-400 mb-3">No question selected</p>
                  <button onClick={addQuestion} className="bg-green-brand hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-bold">
                    + Add First Question
                  </button>
                </div>
              )}

              {activeQ && (
                <div className="max-w-3xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-white">Question {activeQIdx + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${isQComplete(activeQ) ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {isQComplete(activeQ) ? '✓ Complete' : '⚠ Incomplete'}
                      </span>
                    </div>
                    <button onClick={() => setPreview(p => !p)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded">
                      {preview ? 'Edit' : '👁 Preview'}
                    </button>
                  </div>

                  {preview ? (
                    <div className="bg-white text-black rounded-lg p-6 space-y-4">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{activeQ.section} · Q{activeQIdx + 1}</span>
                        <span>Marks: +{activeQ.marks || form.marksPerQuestion}  / −{form.negativeMarks}</span>
                      </div>
                      <p className="text-base font-medium whitespace-pre-wrap">{activeQ.question || '(empty)'}</p>
                      {activeQ.imageUrl && <img src={activeQ.imageUrl} alt="" className="max-h-60 rounded" />}
                      <div className="space-y-2">
                        {activeQ.options.map((o, oi) => (
                          <div key={oi} className={`flex gap-3 p-3 rounded border ${activeQ.correctIndex === oi ? 'bg-green-50 border-green-400' : 'border-gray-200'}`}>
                            <span className="font-bold">{String.fromCharCode(65 + oi)}.</span>
                            <span>{o || '(empty)'}</span>
                          </div>
                        ))}
                      </div>
                      {activeQ.explanation && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm">
                          <strong>Explanation:</strong> {activeQ.explanation}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Section</label>
                          <input value={activeQ.section} onChange={e => updateQ(activeQIdx, { section: e.target.value })}
                            list="sections-list"
                            placeholder="Physics / Chemistry / Math"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          <datalist id="sections-list">
                            {sections.map(s => <option key={s} value={s} />)}
                            <option value="Physics" />
                            <option value="Chemistry" />
                            <option value="Mathematics" />
                            <option value="Biology" />
                          </datalist>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Marks override (blank = test default)</label>
                          <input type="number" value={activeQ.marks ?? ''} onChange={e => updateQ(activeQIdx, { marks: e.target.value === '' ? null : Number(e.target.value) })}
                            placeholder={String(form.marksPerQuestion)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Question text *</label>
                        <textarea value={activeQ.question} onChange={e => updateQ(activeQIdx, { question: e.target.value })}
                          rows={4} placeholder="Type the question here..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm" />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Image (optional) — upload or paste URL</label>
                        <div className="flex gap-2">
                          <input value={activeQ.imageUrl} onChange={e => updateQ(activeQIdx, { imageUrl: e.target.value })}
                            placeholder="https://... or upload below"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          <label className={`cursor-pointer bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? '⏳ Uploading...' : '📁 Upload'}
                            <input type="file" accept="image/*" hidden
                              onChange={(e) => handleImageUpload(e, activeQIdx)} />
                          </label>
                          {activeQ.imageUrl && (
                            <button onClick={() => updateQ(activeQIdx, { imageUrl: '' })}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
                              ×
                            </button>
                          )}
                        </div>
                        {activeQ.imageUrl && (
                          <img src={activeQ.imageUrl} alt="" className="mt-2 max-h-48 rounded border border-white/10"
                            onError={(e) => { e.target.style.display = 'none'; }} />
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">JPG/PNG, max 5MB. Stored in Firebase Storage.</p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-2">Options * (click radio to mark correct)</label>
                        <div className="space-y-2">
                          {activeQ.options.map((opt, oi) => (
                            <div key={oi} className={`flex gap-3 items-center p-3 rounded-lg border ${activeQ.correctIndex === oi ? 'bg-green-brand/10 border-green-brand' : 'bg-white/5 border-white/10'}`}>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`correct_active`} checked={activeQ.correctIndex === oi}
                                  onChange={() => updateQ(activeQIdx, { correctIndex: oi })} className="accent-green-brand w-4 h-4" />
                                <span className="text-sm text-white font-bold w-5">{String.fromCharCode(65 + oi)}.</span>
                              </label>
                              <input value={opt} onChange={e => updateOpt(activeQIdx, oi, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                className="flex-1 bg-transparent border-0 focus:outline-none text-white text-sm" />
                              {activeQ.correctIndex === oi && <span className="text-xs text-green-brand font-bold">✓ Correct</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Explanation (optional, shown after submission)</label>
                        <textarea value={activeQ.explanation} onChange={e => updateQ(activeQIdx, { explanation: e.target.value })}
                          rows={2} placeholder="Why is this answer correct..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button onClick={() => dupQuestion(activeQIdx)} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2 rounded">
                          ⎘ Duplicate
                        </button>
                        <button onClick={() => { if (confirm(`Delete Q${activeQIdx + 1}?`)) removeQuestion(activeQIdx); }} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-3 py-2 rounded">
                          × Delete this Q
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button onClick={closeModal} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg">Cancel</button>
            <button onClick={save} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-2.5 rounded-lg">
              {editing ? 'Save Changes' : 'Create Test'}
            </button>
          </div>
        </div>
      </Modal>

      {/* JSON bulk import */}
      <Modal isOpen={jsonModal} onClose={() => setJsonModal(false)} title="Bulk Import Questions (JSON)" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Paste JSON array. Each item: <code className="bg-black/30 px-1 rounded">{`{question, options:[a,b,c,d], correctIndex, section?, explanation?, imageUrl?}`}</code>
          </p>
          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
            rows={14} placeholder={`[\n  {"question":"2+2?","options":["3","4","5","6"],"correctIndex":1,"section":"Math"}\n]`}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <div className="flex gap-2">
            <button onClick={() => setJsonModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg">Cancel</button>
            <button onClick={bulkImport} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-2 rounded-lg">Import</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
