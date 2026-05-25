import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState, useMemo } from 'react';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument, deleteDocument, uploadFile } from '../../lib/firebaseHelpers';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import ExportButton from '../../components/ExportButton';

const VISIBILITY_OPTIONS = [
  { id: 'public', label: 'Public (All Students)', icon: '🌐', color: 'bg-blue-500/10 text-blue-400' },
  { id: 'batch', label: 'Batch Students Only', icon: '🎓', color: 'bg-purple-500/10 text-purple-400' },
  { id: 'course', label: 'Course Specific', icon: '📚', color: 'bg-amber-500/10 text-amber-400' },
];

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
  isFree: true,
  price: 0,
  questions: [],
  testType: 'single', // 'single', 'live'
  liveStartTime: '',
  liveEndTime: '',
  resultMode: 'instant', // 'instant', 'scheduled', 'manual'
  resultPublishDate: '',
  allowRetakes: false,
  defaultQuestionType: 'mcq-single', // 'mcq-single', 'mcq-multi', 'text', 'custom'
  visibility: 'public', // 'public' | 'batch' | 'course'
  visibilityCourseIds: [],
  visibilityBatchIds: [],
  expiryType: 'lifetime', // 'lifetime' | 'date'
  expiryDate: '',
};

const emptyQ = (defaultType = 'mcq-single') => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  section: 'Physics',
  questionType: defaultType === 'custom' ? 'mcq-single' : defaultType,
  question: '',
  imageUrl: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  correctIndices: [],
  expectedAnswer: '',
  marks: null, // null = use test default
  explanation: '',
});

const emptySeriesForm = {
  title: '',
  description: '',
  category: 'jee-main',
  isFree: true,
  price: 0,
  thumbnail: '',
  testIds: [],
  visibility: 'public',
  visibilityCourseIds: [],
  visibilityBatchIds: [],
  expiryType: 'lifetime',
  expiryDate: '',
};

function isQComplete(q) {
  if (!q.question.trim()) return false;
  if (q.questionType === 'text') return true; // expectedAnswer is optional
  return q.options.every(o => o.trim());
}

// Smart searchable picker component
function ItemPicker({ selectedIds, onChange, items, placeholder = "Search...", emptyText = "No items found", itemLabel = "item(s)" }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="mt-2">
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder={placeholder} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2" />
      <div className="bg-black/30 border border-white/10 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-3">{emptyText}</p>
        ) : filtered.map(c => (
          <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
            <input type="checkbox" checked={selectedIds.includes(c.id)}
              onChange={() => {
                const next = selectedIds.includes(c.id) ? selectedIds.filter(x => x !== c.id) : [...selectedIds, c.id];
                onChange(next);
              }} className="w-4 h-4 accent-green-brand" />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white font-medium truncate">{c.title}</div>
              <div className="text-[10px] text-slate-500">{c.level || ''} {c.isFree ? '• Free' : ''}</div>
            </div>
          </label>
        ))}
      </div>
      {selectedIds.length > 0 && <p className="text-xs text-green-400 mt-1 font-medium">{selectedIds.length} {itemLabel} linked</p>}
    </div>
  );
}

export default function ManageMockTests() {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'series'

  const { data: tests, loading: testsLoading } = useRealtimeCollection('mockTests', { fallback: [] });
  const { data: series, loading: seriesLoading } = useRealtimeCollection('testSeries', { fallback: [] });
  const { data: courses } = useRealtimeCollection('courses', { fallback: [] });
  const { data: batches } = useRealtimeCollection('batches', { fallback: [] });

  // Test State
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [jsonModal, setJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Series State
  const [seriesModal, setSeriesModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [sForm, setSForm] = useState(emptySeriesForm);

  // --- Image Upload ---
  const handleImageUpload = async (e, qIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large (max 5MB)'); return; }
    setUploading(true);
    try {
      const path = `mockTestImages/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const url = await uploadFile(path, file);
      updateQ(qIdx, { imageUrl: url });
      toast.success('Image uploaded');
    } catch (err) { toast.error('Upload failed: ' + err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  // --- Tests Logic ---
  const filtered = tests.filter(t => {
    if (filter !== 'all' && t.category !== filter) return false;
    if (batchFilter !== 'all' && !(t.visibilityBatchIds || []).includes(batchFilter)) return false;
    return true;
  });
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
      marksPerQuestion: t.marksPerQuestion || 4,
      negativeMarks: t.negativeMarks || 1,
      isFree: t.price ? false : true,
      price: t.price || 0,
      testType: t.testType || 'single',
      liveStartTime: t.liveStartTime || '',
      liveEndTime: t.liveEndTime || '',
      resultMode: t.resultMode || 'instant',
      resultPublishDate: t.resultPublishDate || '',
      allowRetakes: !!t.allowRetakes,
      defaultQuestionType: t.defaultQuestionType || 'mcq-single',
      visibility: t.visibility || 'public',
      visibilityCourseIds: t.visibilityCourseIds || [],
      visibilityBatchIds: t.visibilityBatchIds || [],
      expiryType: t.expiryType || 'lifetime',
      expiryDate: t.expiryDate || '',
      questions: (t.questions || []).map(q => ({
        section: 'Physics',
        imageUrl: '',
        marks: null,
        explanation: '',
        questionType: q.questionType || t.defaultQuestionType || 'mcq-single',
        correctIndices: q.correctIndices || (typeof q.correctIndex === 'number' ? [q.correctIndex] : []),
        expectedAnswer: q.expectedAnswer || '',
        ...q,
      })),
    });
    setActiveQIdx(0);
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); setActiveQIdx(0); };

  const addQuestion = () => {
    setForm(f => ({ ...f, questions: [...f.questions, emptyQ(f.defaultQuestionType)] }));
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
        ...emptyQ(form.defaultQuestionType),
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
    } catch (err) { toast.error('Invalid JSON: ' + err.message); }
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    if (!form.questions.length) { toast.error('Add at least one question'); return; }
    if (form.visibility === 'course' && form.visibilityCourseIds.length === 0) {
      toast.error('Select at least one course for course-specific visibility'); return;
    }
    if (form.visibility === 'batch' && form.visibilityBatchIds.length === 0) {
      toast.error('Select at least one batch for batch-specific visibility'); return;
    }
    if (form.expiryType === 'date' && !form.expiryDate) {
      toast.error('Set an expiry date or choose Lifetime'); return;
    }
    for (const [i, q] of form.questions.entries()) {
      if (!q.question.trim()) { toast.error(`Q${i + 1}: question text missing`); return; }
      if ((q.questionType === 'mcq-single' || q.questionType === 'mcq-multi') && q.options.some(o => !o.trim())) { 
        toast.error(`Q${i + 1}: all 4 options needed`); return; 
      }
    }
    const payload = {
      ...form,
      duration: Number(form.duration),
      marksPerQuestion: Number(form.marksPerQuestion),
      negativeMarks: Number(form.negativeMarks),
      price: form.isFree ? 0 : (Number(form.price) || 0),
      questions: form.questions,
      testType: form.testType,
      liveStartTime: form.liveStartTime,
      liveEndTime: form.liveEndTime,
      resultMode: form.resultMode,
      resultPublishDate: form.resultPublishDate,
      allowRetakes: form.allowRetakes,
      defaultQuestionType: form.defaultQuestionType,
      visibility: form.visibility,
      visibilityCourseIds: form.visibility === 'course' ? form.visibilityCourseIds : [],
      visibilityBatchIds: form.visibility === 'batch' ? form.visibilityBatchIds : [],
      expiryType: form.expiryType,
      expiryDate: form.expiryDate,
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

  // --- Series Logic ---
  const openCreateSeries = () => { setEditingSeries(null); setSForm(emptySeriesForm); setSeriesModal(true); };
  const openEditSeries = (s) => {
    setEditingSeries(s);
    setSForm({
      title: s.title || '',
      description: s.description || '',
      category: s.category || 'jee-main',
      isFree: s.price ? false : true,
      price: s.price || 0,
      thumbnail: s.thumbnail || '',
      testIds: s.testIds || [],
      visibility: s.visibility || 'public',
      visibilityCourseIds: s.visibilityCourseIds || [],
      visibilityBatchIds: s.visibilityBatchIds || [],
      expiryType: s.expiryType || 'lifetime',
      expiryDate: s.expiryDate || '',
    });
    setSeriesModal(true);
  };
  const closeSeriesModal = () => { setSeriesModal(false); setEditingSeries(null); setSForm(emptySeriesForm); };

  const saveSeries = async () => {
    if (!sForm.title.trim()) { toast.error('Title required'); return; }
    if (sForm.visibility === 'course' && sForm.visibilityCourseIds.length === 0) {
      toast.error('Select at least one course for course-specific visibility'); return;
    }
    const payload = {
      ...sForm,
      price: sForm.isFree ? 0 : (Number(sForm.price) || 0),
    };
    try {
      if (editingSeries) {
        await updateDocument('testSeries', editingSeries.id, payload);
        toast.success('Series updated');
      } else {
        await addDocument('testSeries', payload);
        toast.success('Series created');
      }
      closeSeriesModal();
    } catch (err) { toast.error(err.message); }
  };

  const removeSeries = async (id) => {
    if (!confirm('Delete this test series?')) return;
    try {
      await deleteDocument('testSeries', id);
      toast.success('Deleted');
    } catch (err) { toast.error(err.message); }
  };

  const toggleTestInSeries = (testId) => {
    setSForm(f => {
      const ids = f.testIds.includes(testId)
        ? f.testIds.filter(id => id !== testId)
        : [...f.testIds, testId];
      return { ...f, testIds: ids };
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Papers & Series</h1>
          <p className="text-sm text-slate-400">Manage individual tests and test bundles</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <button onClick={() => setActiveTab('tests')} className={`px-4 py-2 text-sm font-bold rounded-md ${activeTab === 'tests' ? 'bg-green-brand text-white' : 'text-slate-400 hover:text-white'}`}>
            Individual Tests
          </button>
          <button onClick={() => setActiveTab('series')} className={`px-4 py-2 text-sm font-bold rounded-md ${activeTab === 'series' ? 'bg-green-brand text-white' : 'text-slate-400 hover:text-white'}`}>
            Test Series
          </button>
        </div>
      </div>

      {activeTab === 'tests' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === 'all' ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                All ({tests.length})
              </button>
              {CATEGORIES.map(c => {
                const count = tests.filter(t => t.category === c.id).length;
                return (
                  <button key={c.id} onClick={() => setFilter(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === c.id ? 'bg-green-brand text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                    {c.label} ({count})
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {batches && batches.length > 0 && (
                <select
                  value={batchFilter}
                  onChange={e => setBatchFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-green-brand"
                >
                  <option value="all" className="bg-slate-900">All Batches</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>
                  ))}
                </select>
              )}
              <ExportButton data={tests} filename="mock_tests" columns={[ { key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'testType', label: 'Type' } ]} />
              <button onClick={openCreate} className="bg-green-brand hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-sm">+ New Test</button>
            </div>
          </div>

          {testsLoading ? <TableSkeleton /> : filtered.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-slate-400 mb-4">No tests yet.</p>
              <button onClick={openCreate} className="bg-green-brand hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg">Create First Test</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(t => {
                const vis = VISIBILITY_OPTIONS.find(v => v.id === (t.visibility || 'public'));
                const isExpired = t.expiryType === 'date' && t.expiryDate && new Date(t.expiryDate) < new Date();
                return (
                <div key={t.id} className={`bg-white/5 border rounded-2xl p-5 ${isExpired ? 'border-red-500/30 opacity-70' : 'border-white/10'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-green-brand/10 text-green-brand">
                      {CATEGORIES.find(c => c.id === t.category)?.label || t.category}
                    </span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {t.testType === 'live' && <span className="text-xs font-bold px-2 py-1 rounded bg-red-500/10 text-red-400">LIVE</span>}
                      <span className={`text-xs font-bold px-2 py-1 rounded ${t.price > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {t.price > 0 ? `₹${t.price}` : 'Free'}
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-1 rounded ${vis?.color || 'bg-blue-500/10 text-blue-400'}`}>
                        {vis?.icon} {vis?.id === 'public' ? '' : vis?.label?.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-white font-bold mb-1 line-clamp-2">{t.title}</h3>
                  <p className="text-xs text-slate-400 mb-2 line-clamp-2">{t.description}</p>
                  <div className="flex gap-2 text-[10px] mb-3 flex-wrap">
                    {isExpired ? (
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">EXPIRED</span>
                    ) : t.expiryType === 'date' && t.expiryDate ? (
                      <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">Expires: {new Date(t.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    ) : (
                      <span className="bg-green-brand/10 text-green-400 px-2 py-0.5 rounded-full">Lifetime</span>
                    )}
                    {t.visibility === 'course' && t.visibilityCourseIds?.length > 0 && (
                      <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">{t.visibilityCourseIds.length} course(s)</span>
                    )}
                  </div>
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
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'series' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Test Series</h2>
            <div className="flex gap-2 items-center flex-wrap">
              {batches && batches.length > 0 && (
                <select
                  value={batchFilter}
                  onChange={e => setBatchFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-green-brand"
                >
                  <option value="all" className="bg-slate-900">All Batches</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>
                  ))}
                </select>
              )}
              <button onClick={openCreateSeries} className="bg-green-brand hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-sm">+ New Series</button>
            </div>
          </div>
          
          {seriesLoading ? <TableSkeleton /> : series.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-slate-400 mb-4">No test series created yet.</p>
              <button onClick={openCreateSeries} className="bg-green-brand hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg">Create Test Series</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {series.filter(s => {
                if (batchFilter !== 'all' && !(s.visibilityBatchIds || []).includes(batchFilter)) return false;
                return true;
              }).map(s => {
                const vis = VISIBILITY_OPTIONS.find(v => v.id === (s.visibility || 'public'));
                const isExpired = s.expiryType === 'date' && s.expiryDate && new Date(s.expiryDate) < new Date();
                return (
                <div key={s.id} className={`bg-white/5 border rounded-2xl p-5 ${isExpired ? 'border-red-500/30 opacity-70' : 'border-white/10'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-500/10 text-indigo-400">SERIES</span>
                    <div className="flex gap-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${s.price > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {s.price > 0 ? `₹${s.price}` : 'Free'}
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-1 rounded ${vis?.color || 'bg-blue-500/10 text-blue-400'}`}>
                        {vis?.icon}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-white font-bold mb-1 line-clamp-2">{s.title}</h3>
                  <p className="text-xs text-slate-400 mb-2 line-clamp-2">{s.description}</p>
                  <div className="flex gap-2 text-[10px] mb-3">
                    {isExpired ? (
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">EXPIRED</span>
                    ) : s.expiryType === 'date' && s.expiryDate ? (
                      <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">Exp: {new Date(s.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    ) : (
                      <span className="bg-green-brand/10 text-green-400 px-2 py-0.5 rounded-full">Lifetime</span>
                    )}
                  </div>
                  <div className="bg-black/30 rounded p-2 text-center mb-3">
                    <span className="text-white font-bold">{s.testIds?.length || 0}</span> <span className="text-slate-500 text-xs">Tests in Bundle</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditSeries(s)} className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded">Edit</button>
                    <button onClick={() => removeSeries(s.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm py-2 px-3 rounded">Delete</button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Test Form Modal */}
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Mock Test' : 'New Mock Test'} size="full">
        <div className="flex flex-col h-[85vh]">
          {/* Top Config Strip */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Test title" className="md:col-span-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>)}
            </select>
            
            <div className="flex gap-2 items-center bg-black/40 border border-white/10 rounded-lg px-2 col-span-2 md:col-span-1">
              <select value={form.isFree ? 'free' : 'paid'} onChange={e => setForm({ ...form, isFree: e.target.value === 'free', price: e.target.value === 'free' ? 0 : form.price })}
                className="bg-transparent text-white text-sm outline-none cursor-pointer">
                <option value="free" className="bg-slate-900">Free</option>
                <option value="paid" className="bg-slate-900">Paid</option>
              </select>
              {!form.isFree && (
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="₹ Price" title="Price"
                  className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm ml-auto" />
              )}
            </div>
            
            <select value={form.testType} onChange={e => setForm({ ...form, testType: e.target.value })}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" title="Test Type">
              <option value="single" className="bg-slate-900">Standard Test</option>
              <option value="live" className="bg-slate-900">Live Scheduled Test</option>
            </select>
            <select value={form.resultMode} onChange={e => setForm({ ...form, resultMode: e.target.value })}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" title="Result Mode">
              <option value="instant" className="bg-slate-900">Instant Results</option>
              <option value="scheduled" className="bg-slate-900">Scheduled Results</option>
              <option value="manual" className="bg-slate-900">Manual Review</option>
            </select>

            {form.testType === 'live' && (
              <>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Live Start Time</label>
                  <input type="datetime-local" value={form.liveStartTime} onChange={e => setForm({ ...form, liveStartTime: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Live End Time</label>
                  <input type="datetime-local" value={form.liveEndTime} onChange={e => setForm({ ...form, liveEndTime: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </>
            )}

            {form.resultMode === 'scheduled' && (
              <div className="md:col-span-2">
                <label className="text-[10px] text-slate-400 block mb-1">Result Publish Date</label>
                <input type="datetime-local" value={form.resultPublishDate} onChange={e => setForm({ ...form, resultPublishDate: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2 cursor-pointer bg-black/40 border border-white/10 rounded-lg px-3 py-2">
              <input type="checkbox" checked={form.allowRetakes} onChange={e => setForm({ ...form, allowRetakes: e.target.checked })}
                className="w-4 h-4 accent-green-brand" />
              Allow Retakes
            </label>

            <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-white/10 pt-3 mt-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Duration (mins)</label>
                <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                  placeholder="Duration (min)" title="Duration (min)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Marks / Question</label>
                <input type="number" value={form.marksPerQuestion} onChange={e => setForm({ ...form, marksPerQuestion: e.target.value })}
                  placeholder="Marks/Q" title="Marks per Q" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Negative Marks</label>
                <input type="number" value={form.negativeMarks} onChange={e => setForm({ ...form, negativeMarks: e.target.value })}
                  placeholder="-ve Marks" title="Negative marks" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Default Question Type</label>
                <select value={form.defaultQuestionType} onChange={e => setForm({ ...form, defaultQuestionType: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" title="Default Question Type">
                  <option value="mcq-single" className="bg-slate-900">MCQ (Single Correct)</option>
                  <option value="mcq-multi" className="bg-slate-900">MCQ (Multiple Correct)</option>
                  <option value="text" className="bg-slate-900">Text Input</option>
                  <option value="custom" className="bg-slate-900">Custom Per Question</option>
                </select>
              </div>
            </div>

            {/* Visibility & Expiry Row */}
            <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-white/10 pt-3 mt-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Visibility</label>
                <select value={form.visibility} onChange={e => {
                  const vis = e.target.value;
                  setForm({ 
                    ...form, 
                    visibility: vis, 
                    visibilityCourseIds: vis === 'course' ? (form.visibilityCourseIds || []) : [],
                    visibilityBatchIds: vis === 'batch' ? (form.visibilityBatchIds || []) : []
                  });
                }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {VISIBILITY_OPTIONS.map(v => <option key={v.id} value={v.id} className="bg-slate-900">{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Access Expiry</label>
                <select value={form.expiryType} onChange={e => setForm({ ...form, expiryType: e.target.value, expiryDate: e.target.value === 'lifetime' ? '' : form.expiryDate })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="lifetime" className="bg-slate-900">♾ Lifetime Access</option>
                  <option value="date" className="bg-slate-900">📅 Specific Expiry Date</option>
                </select>
              </div>
              {form.expiryType === 'date' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              )}
              {form.visibility === 'batch' && (
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Link to Batches</label>
                  <ItemPicker 
                    selectedIds={form.visibilityBatchIds || []} 
                    onChange={ids => setForm({ ...form, visibilityBatchIds: ids })} 
                    items={batches.map(b => ({id: b.id, title: b.name, level: 'Batch'}))} 
                    placeholder="🔍 Search batches..." 
                    emptyText="No batches found" 
                    itemLabel="batch(es)" 
                  />
                </div>
              )}
              {form.visibility === 'course' && (
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Link to Courses</label>
                  <ItemPicker 
                    selectedIds={form.visibilityCourseIds || []} 
                    onChange={ids => setForm({ ...form, visibilityCourseIds: ids })} 
                    items={courses} 
                    placeholder="🔍 Search courses..." 
                    emptyText="No courses found" 
                    itemLabel="course(s)" 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Split layout */}
          <div className="flex-1 flex overflow-hidden border border-white/10 rounded-lg bg-black/20">
            {/* Left: Q list */}
            <div className="w-72 border-r border-white/10 flex flex-col overflow-hidden bg-black/40">
              <div className="p-3 border-b border-white/10 flex gap-2">
                <button onClick={addQuestion} className="flex-1 bg-green-brand hover:bg-green-600 text-white text-xs font-bold py-2 rounded">
                  + Add Q
                </button>
                <button onClick={() => setJsonModal(true)} title="Bulk import JSON" className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 rounded">
                  JSON
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {form.questions.map((q, i) => {
                  const complete = isQComplete(q);
                  const active = i === activeQIdx;
                  const stop = (fn) => (e) => { e.stopPropagation(); e.preventDefault(); fn(); };
                  return (
                    <div key={q.id} role="button" onClick={() => setActiveQIdx(i)}
                      className={`p-2 rounded cursor-pointer border ${active ? 'bg-green-brand/20 border-green-brand' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                      <div className="flex items-center gap-2 min-w-0 mb-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${complete ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <span className="text-xs text-white font-bold flex-shrink-0">Q{i + 1}</span>
                        <span className="text-[10px] text-slate-400 truncate flex-1">{q.question || '(empty)'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 truncate">{q.section}</span>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <button type="button" onClick={stop(() => moveQ(i, -1))} disabled={i === 0}
                            className="text-xs text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-20 w-6 h-6 rounded flex items-center justify-center">↑</button>
                          <button type="button" onClick={stop(() => moveQ(i, 1))} disabled={i === form.questions.length - 1}
                            className="text-xs text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-20 w-6 h-6 rounded flex items-center justify-center">↓</button>
                          <button type="button" onClick={stop(() => dupQuestion(i))}
                            className="text-xs text-slate-300 hover:text-white hover:bg-white/10 w-6 h-6 rounded flex items-center justify-center">⎘</button>
                          <button type="button" onClick={stop(() => { if (confirm(`Delete Q${i + 1}?`)) removeQuestion(i); })}
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 w-6 h-6 rounded flex items-center justify-center">×</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: active Q editor */}
            <div className="flex-1 overflow-y-auto p-5">
              {!activeQ ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-slate-400 mb-3">No question selected</p>
                </div>
              ) : (
                <div className="max-w-3xl">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                    <span className="text-xl font-bold text-white">Question {activeQIdx + 1}</span>
                    <div className="flex gap-3">
                      {form.defaultQuestionType === 'custom' && (
                        <select value={activeQ.questionType || 'mcq-single'} onChange={e => updateQ(activeQIdx, { questionType: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded px-2 text-xs text-white">
                          <option value="mcq-single" className="bg-slate-900">MCQ (Single)</option>
                          <option value="mcq-multi" className="bg-slate-900">MCQ (Multiple)</option>
                          <option value="text" className="bg-slate-900">Text Input</option>
                        </select>
                      )}
                      <button onClick={() => setPreview(p => !p)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded">
                        {preview ? 'Edit' : '👁 Preview'}
                      </button>
                    </div>
                  </div>

                  {preview ? (
                    <div className="bg-white text-black rounded-lg p-6 space-y-4">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{activeQ.section} · {activeQ.questionType}</span>
                        <span>Marks: +{activeQ.marks || form.marksPerQuestion} / −{form.negativeMarks}</span>
                      </div>
                      <p className="text-base font-medium whitespace-pre-wrap">{activeQ.question}</p>
                      {activeQ.imageUrl && <img src={activeQ.imageUrl} alt="" className="max-h-60 rounded" />}
                      
                      {activeQ.questionType === 'text' ? (
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded text-sm text-gray-500 italic">
                          Student will see a text box to type their answer.<br/><br/>
                          <strong>Model Answer:</strong> {activeQ.expectedAnswer || 'None provided'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeQ.options.map((o, oi) => {
                            const isCorrect = activeQ.questionType === 'mcq-multi' 
                              ? activeQ.correctIndices?.includes(oi)
                              : activeQ.correctIndex === oi;
                            return (
                              <div key={oi} className={`flex gap-3 p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-400' : 'border-gray-200'}`}>
                                <span className="font-bold">{String.fromCharCode(65 + oi)}.</span>
                                <span>{o}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                            list="sections-list" placeholder="Physics / Chemistry / Math"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          <datalist id="sections-list">{sections.map(s => <option key={s} value={s} />)}</datalist>
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
                        <label className="text-xs text-slate-400 block mb-1">Image (optional)</label>
                        <div className="flex gap-2">
                          <input value={activeQ.imageUrl} onChange={e => updateQ(activeQIdx, { imageUrl: e.target.value })}
                            placeholder="https://..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                          <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg">
                            {uploading ? '⏳...' : '📁 Upload'}
                            <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e, activeQIdx)} />
                          </label>
                        </div>
                        {activeQ.imageUrl && <img src={activeQ.imageUrl} alt="" className="mt-2 max-h-48 rounded" />}
                      </div>

                      {(activeQ.questionType === 'mcq-single' || activeQ.questionType === 'mcq-multi') && (
                        <div>
                          <label className="text-xs text-slate-400 block mb-2">Options * (select correct answer(s))</label>
                          <div className="space-y-2">
                            {activeQ.options.map((opt, oi) => {
                              const isMulti = activeQ.questionType === 'mcq-multi';
                              const isChecked = isMulti ? activeQ.correctIndices?.includes(oi) : activeQ.correctIndex === oi;
                              return (
                                <div key={oi} className={`flex gap-3 items-center p-3 rounded-lg border ${isChecked ? 'bg-green-brand/10 border-green-brand' : 'bg-white/5 border-white/10'}`}>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type={isMulti ? 'checkbox' : 'radio'} checked={isChecked}
                                      onChange={(e) => {
                                        if (isMulti) {
                                          const curr = activeQ.correctIndices || [];
                                          const next = e.target.checked ? [...curr, oi] : curr.filter(x => x !== oi);
                                          updateQ(activeQIdx, { correctIndices: next });
                                        } else {
                                          updateQ(activeQIdx, { correctIndex: oi });
                                        }
                                      }} className="accent-green-brand w-4 h-4" />
                                    <span className="text-sm text-white font-bold w-5">{String.fromCharCode(65 + oi)}.</span>
                                  </label>
                                  <input value={opt} onChange={e => updateOpt(activeQIdx, oi, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                    className="flex-1 bg-transparent border-0 focus:outline-none text-white text-sm" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {activeQ.questionType === 'text' && (
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Model Answer / Rubric (optional, for admin review ref)</label>
                          <textarea value={activeQ.expectedAnswer || ''} onChange={e => updateQ(activeQIdx, { expectedAnswer: e.target.value })}
                            rows={3} placeholder="What admin should look for when grading..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Explanation (optional)</label>
                        <textarea value={activeQ.explanation} onChange={e => updateQ(activeQIdx, { explanation: e.target.value })}
                          rows={2} placeholder="Why is this correct..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-2 border-t border-white/10">
            <button onClick={closeModal} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg">Cancel</button>
            <button onClick={save} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-2.5 rounded-lg">
              {editing ? 'Save Changes' : 'Create Test'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Series Form Modal */}
      <Modal isOpen={seriesModal} onClose={closeSeriesModal} title={editingSeries ? 'Edit Test Series' : 'New Test Series'} size="lg">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <input value={sForm.title} onChange={e => setSForm({ ...sForm, title: e.target.value })}
            placeholder="Series Title" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-bold" />
          <textarea value={sForm.description} onChange={e => setSForm({ ...sForm, description: e.target.value })}
            placeholder="Description" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select value={sForm.category} onChange={e => setSForm({ ...sForm, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Pricing</label>
              <div className="flex gap-2 items-center">
                  <select value={sForm.isFree ? 'free' : 'paid'} onChange={e => setSForm({ ...sForm, isFree: e.target.value === 'free', price: e.target.value === 'free' ? 0 : sForm.price })}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none cursor-pointer">
                    <option value="free" className="bg-slate-900">Free</option>
                    <option value="paid" className="bg-slate-900">Paid</option>
                  </select>
                  {!sForm.isFree && (
                    <input type="number" value={sForm.price} onChange={e => setSForm({ ...sForm, price: e.target.value })}
                      placeholder="₹ Price" className="w-24 bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                  )}
                </div>
            </div>
          </div>
          
          <div>
            <label className="text-xs text-slate-400 block mb-2 font-bold">Select Tests to Bundle</label>
            <div className="bg-black/30 border border-white/10 rounded-lg max-h-64 overflow-y-auto p-2 space-y-1">
              {tests.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">No tests available.</p>
              ) : tests.map(t => (
                <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer border border-transparent hover:border-white/5">
                  <input type="checkbox" checked={sForm.testIds.includes(t.id)} onChange={() => toggleTestInSeries(t.id)}
                    className="w-4 h-4 accent-green-brand" />
                  <div>
                    <div className="text-sm text-white font-medium">{t.title}</div>
                    <div className="text-[10px] text-slate-500">{CATEGORIES.find(c=>c.id===t.category)?.label} • {t.questions?.length||0} Qs</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-green-400 mt-2 font-medium">{sForm.testIds.length} tests selected</p>
          </div>

          {/* Visibility & Expiry */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <label className="text-xs text-slate-400 block mb-2 font-bold">Visibility & Expiry</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Visibility</label>
                <select value={sForm.visibility} onChange={e => {
                  const vis = e.target.value;
                  setSForm({ 
                    ...sForm, 
                    visibility: vis, 
                    visibilityCourseIds: vis === 'course' ? (sForm.visibilityCourseIds || []) : [],
                    visibilityBatchIds: vis === 'batch' ? (sForm.visibilityBatchIds || []) : []
                  });
                }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {VISIBILITY_OPTIONS.map(v => <option key={v.id} value={v.id} className="bg-slate-900">{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Access Expiry</label>
                <select value={sForm.expiryType} onChange={e => setSForm({ ...sForm, expiryType: e.target.value, expiryDate: e.target.value === 'lifetime' ? '' : sForm.expiryDate })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="lifetime" className="bg-slate-900">♾ Lifetime Access</option>
                  <option value="date" className="bg-slate-900">📅 Specific Expiry Date</option>
                </select>
              </div>
              {sForm.expiryType === 'date' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Expiry Date</label>
                  <input type="date" value={sForm.expiryDate} onChange={e => setSForm({ ...sForm, expiryDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              )}
              {sForm.visibility === 'batch' && (
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Link to Batches</label>
                  <ItemPicker 
                    selectedIds={sForm.visibilityBatchIds || []} 
                    onChange={ids => setSForm({ ...sForm, visibilityBatchIds: ids })} 
                    items={batches.map(b => ({id: b.id, title: b.name, level: 'Batch'}))} 
                    placeholder="🔍 Search batches..." 
                    emptyText="No batches found" 
                    itemLabel="batch(es)" 
                  />
                </div>
              )}
              {sForm.visibility === 'course' && (
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Link to Courses</label>
                  <ItemPicker 
                    selectedIds={sForm.visibilityCourseIds || []} 
                    onChange={ids => setSForm({ ...sForm, visibilityCourseIds: ids })} 
                    items={courses} 
                    placeholder="🔍 Search courses..." 
                    emptyText="No courses found" 
                    itemLabel="course(s)" 
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-white/10">
            <button onClick={closeSeriesModal} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg">Cancel</button>
            <button onClick={saveSeries} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-2 rounded-lg">
              Save Series
            </button>
          </div>
        </div>
      </Modal>

      {/* JSON Modal */}
      <Modal isOpen={jsonModal} onClose={() => setJsonModal(false)} title="Bulk Import Questions (JSON)" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Paste JSON array...</p>
          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} rows={10} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <div className="flex gap-2">
            <button onClick={() => setJsonModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg">Cancel</button>
            <button onClick={bulkImport} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-2 rounded-lg">Import</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
