import { useState } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, deleteDocument } from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

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
  questions: [],
};

const emptyQ = () => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
});

export default function ManageMockTests() {
  const { data: tests, loading } = useRealtimeCollection('mockTests', { fallback: [] });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? tests : tests.filter(t => t.category === filter);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true); };
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
      questions: t.questions || [],
    });
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQ()] }));
  const removeQuestion = (idx) => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  const updateQ = (idx, patch) => setForm(f => ({
    ...f,
    questions: f.questions.map((q, i) => i === idx ? { ...q, ...patch } : q),
  }));
  const updateOpt = (qIdx, oIdx, val) => setForm(f => ({
    ...f,
    questions: f.questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? val : o) } : q),
  }));

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
      totalQuestions: form.questions.length,
      maxMarks: form.questions.length * (Number(form.marksPerQuestion) || 4),
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
          <p className="text-sm text-slate-400">Create timed MCQ tests with auto-scoring</p>
        </div>
        <button onClick={openCreate} className="bg-green-brand hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg">
          + New Test
        </button>
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

      {loading && <p className="text-slate-400 text-center py-8">Loading...</p>}

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
              {t.difficulty && <span className="text-xs text-slate-400">{t.difficulty}</span>}
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
                <div className="text-white font-bold">{(t.questions?.length || 0) * (t.marksPerQuestion ?? 4)}</div>
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

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Mock Test' : 'New Mock Test'} size="xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="JEE Main Mock 01" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Marks/Q</label>
              <input type="number" value={form.marksPerQuestion} onChange={e => setForm({ ...form, marksPerQuestion: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Negative</label>
              <input type="number" value={form.negativeMarks} onChange={e => setForm({ ...form, negativeMarks: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option className="bg-slate-900">Easy</option>
                <option className="bg-slate-900">Medium</option>
                <option className="bg-slate-900">Hard</option>
              </select>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-bold text-sm">Questions ({form.questions.length})</h3>
              <button onClick={addQuestion} className="text-xs bg-green-brand/20 hover:bg-green-brand/30 text-green-brand px-3 py-1.5 rounded">
                + Add Question
              </button>
            </div>

            {form.questions.map((q, qIdx) => (
              <div key={q.id} className="bg-black/30 border border-white/10 rounded-lg p-4 mb-3">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-green-brand font-bold">Q{qIdx + 1}</span>
                  <button onClick={() => removeQuestion(qIdx)} className="text-red-400 text-xs">Remove</button>
                </div>
                <textarea value={q.question} onChange={e => updateQ(qIdx, { question: e.target.value })}
                  rows={2} placeholder="Question text..."
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm mb-2" />
                <div className="space-y-1.5 mb-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2 items-center">
                      <input type="radio" name={`correct_${qIdx}`} checked={q.correctIndex === oi}
                        onChange={() => updateQ(qIdx, { correctIndex: oi })} className="accent-green-brand" />
                      <span className="text-xs text-slate-400 w-4">{String.fromCharCode(65 + oi)}.</span>
                      <input value={opt} onChange={e => updateOpt(qIdx, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm" />
                    </div>
                  ))}
                </div>
                <input value={q.explanation} onChange={e => updateQ(qIdx, { explanation: e.target.value })}
                  placeholder="Explanation (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-xs" />
              </div>
            ))}

            {form.questions.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">No questions yet. Click "Add Question".</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
          <button onClick={closeModal} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg">Cancel</button>
          <button onClick={save} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-2.5 rounded-lg">
            {editing ? 'Save Changes' : 'Create Test'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
