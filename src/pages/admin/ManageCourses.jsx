import { TableSkeleton } from '../../components/ui/Skeleton';
import { useState } from 'react';
import { deleteItemSmart } from '../../lib/contentApi';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument } from '../../lib/firebaseHelpers';
import { defaultCourses } from '../../data/courses';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon } from '../../components/Icons';

const iconMap = { BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon, Rocket: RocketIcon, HeartPulse: HeartPulseIcon };

const emptyForm = {
  title: '', description: '', subjects: '', level: 'Foundation', duration: '12 Months',
  students: 0, image: 'BookOpen', color: '#3b82f6', thumbnail: '',
  variants: [
    { months: 3, price: 4999, originalPrice: 7999, discount: '37% OFF', note: 'Most Popular' },
    { months: 4, price: 6499, originalPrice: 9999, discount: '35% OFF', note: 'Best Value' },
  ],
  lessons: [],
};

const emptyLesson = () => ({
  id: `lesson_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  title: '',
  videoUrl: '',
  duration: '',
  description: '',
  order: 0,
  isFree: false,
});

const ytId = (url) => {
  const m = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : '';
};
const ytThumb = (url) => { const id = ytId(url); return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ''; };

export default function ManageCourses() {
  const { data: coursesRaw, loading } = useRealtimeCollection('courses', { fallback: defaultCourses });
  const courses = coursesRaw?.length ? coursesRaw : defaultCourses;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState('basic'); // basic | variants | lessons

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      ...emptyForm,
      ...c,
      subjects: Array.isArray(c.subjects) ? c.subjects.join(', ') : (c.subjects || ''),
      variants: c.variants?.length ? c.variants : emptyForm.variants,
      lessons: c.lessons || [],
    });
    setTab('basic');
    setModal(true);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setTab('basic'); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    const subjectsArr = typeof form.subjects === 'string'
      ? form.subjects.split(',').map(s => s.trim()).filter(Boolean)
      : form.subjects;
    const autoThumb = !form.thumbnail ? ytThumb(form.lessons?.[0]?.videoUrl) : '';
    const payload = {
      ...form,
      thumbnail: form.thumbnail || autoThumb || '',
      subjects: subjectsArr,
      students: Number(form.students) || 0,
      variants: form.variants.map(v => ({
        ...v,
        months: Number(v.months),
        price: Number(v.price),
        originalPrice: Number(v.originalPrice) || Number(v.price),
      })),
      lessons: form.lessons.map((l, i) => ({ ...l, order: i + 1 })),
    };
    try {
      if (editing) {
        await updateDocument('courses', editing.id, payload);
        toast.success('Course updated');
      } else {
        await addDocument('courses', payload);
        toast.success('Course added');
      }
      closeModal();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this course?')) return;
    try { await deleteItemSmart('courses', id); toast.success('Deleted'); }
    catch (err) { toast.error(err.message); }
  };

  // Variant helpers
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { months: 1, price: 1999, originalPrice: 2999, discount: '', note: '' }] }));
  const removeVariant = (idx) => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));
  const updateVariant = (idx, patch) => setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === idx ? { ...v, ...patch } : v) }));

  // Lesson helpers
  const addLesson = () => setForm(f => ({ ...f, lessons: [...f.lessons, emptyLesson()] }));
  const removeLesson = (idx) => setForm(f => ({ ...f, lessons: f.lessons.filter((_, i) => i !== idx) }));
  const updateLesson = (idx, patch) => setForm(f => ({ ...f, lessons: f.lessons.map((l, i) => i === idx ? { ...l, ...patch } : l) }));
  const moveLesson = (idx, dir) => {
    setForm(f => {
      const arr = [...f.lessons];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return f;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...f, lessons: arr };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Courses</h1>
          <p className="text-sm text-slate-400">{courses.length} courses</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add Course</button>
      </div>
      {loading && <TableSkeleton />}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th></th><th>Title</th><th>Level</th><th>Variants</th><th>Lessons</th><th>Students</th><th>Actions</th></tr></thead>
            <tbody>{courses.map(c => {
              const Ico = iconMap[c.image] || BookOpenIcon;
              return (
                <tr key={c.id}>
                  <td><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: (c.color || '#3b82f6') + '20' }}><Ico size={16} style={{ color: c.color || '#3b82f6' }} /></div></td>
                  <td className="font-medium text-white">{c.title}</td>
                  <td><span className="badge badge-navy">{c.level}</span></td>
                  <td className="text-slate-300">{c.variants?.length || 0}</td>
                  <td className="text-slate-300">{c.lessons?.length || 0}</td>
                  <td>{c.students || 0}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-sm text-blue-400">Edit</button>
                      <button onClick={() => remove(c.id)} className="text-sm text-red-400">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Course' : 'Add Course'} size="xl">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 mb-4 -mx-1">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'variants', label: `Pricing (${form.variants.length})` },
            { id: 'lessons', label: `Lessons (${form.lessons.length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-green-brand text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {tab === 'basic' && (
            <>
              <div><label className="text-xs text-slate-400 block mb-1">Title</label>
                <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 block mb-1">Level</label>
                  <select className="input-field" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                    {['Foundation', 'Intermediate', 'Competitive'].map(l => <option key={l}>{l}</option>)}
                  </select></div>
                <div><label className="text-xs text-slate-400 block mb-1">Duration label</label>
                  <input className="input-field" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Students</label>
                  <input type="number" className="input-field" value={form.students} onChange={e => setForm({ ...form, students: e.target.value })} /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Color</label>
                  <input type="color" className="input-field h-10" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <div><label className="text-xs text-slate-400 block mb-1">Subjects (comma separated)</label>
                <input className="input-field" value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} /></div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Thumbnail URL (optional — auto-derived from first lesson's YouTube if blank)</label>
                <input className="input-field" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://... or leave blank" />
                {(form.thumbnail || ytThumb(form.lessons?.[0]?.videoUrl)) && (
                  <img src={form.thumbnail || ytThumb(form.lessons?.[0]?.videoUrl)} alt="" className="mt-2 w-40 aspect-video object-cover rounded border border-white/10" onError={e => { e.target.style.display = 'none'; }} />
                )}
              </div>
            </>
          )}

          {tab === 'variants' && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">Plans students can buy. Add 3-month, 4-month variants etc.</p>
                <button onClick={addVariant} className="text-xs bg-green-brand/20 text-green-brand px-3 py-1.5 rounded">+ Add Plan</button>
              </div>
              {form.variants.map((v, idx) => (
                <div key={idx} className="bg-black/30 border border-white/10 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-green-brand font-bold">Plan {idx + 1}</span>
                    <button onClick={() => removeVariant(idx)} className="text-red-400 text-xs">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div><label className="text-[10px] text-slate-500">Months</label>
                      <input type="number" value={v.months} onChange={e => updateVariant(idx, { months: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm" /></div>
                    <div><label className="text-[10px] text-slate-500">Price ₹</label>
                      <input type="number" value={v.price} onChange={e => updateVariant(idx, { price: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm" /></div>
                    <div><label className="text-[10px] text-slate-500">Original ₹</label>
                      <input type="number" value={v.originalPrice} onChange={e => updateVariant(idx, { originalPrice: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm" /></div>
                    <div><label className="text-[10px] text-slate-500">Discount tag</label>
                      <input value={v.discount} onChange={e => updateVariant(idx, { discount: e.target.value })}
                        placeholder="35% OFF" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm" /></div>
                  </div>
                  <input value={v.note} onChange={e => updateVariant(idx, { note: e.target.value })}
                    placeholder='Note like "Most Popular"' className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs mt-2" />
                </div>
              ))}
            </>
          )}

          {tab === 'lessons' && (
            <>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200">
                <div className="font-bold mb-1">💡 Zero storage cost — use YouTube</div>
                <div>Upload videos to YouTube as <b>Unlisted</b> (private link, not searchable). Paste link below — works for any visibility. No Firebase storage bill.</div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">Sequential lessons. Students watch in order after enrolling.</p>
                <button onClick={addLesson} className="text-xs bg-green-brand/20 text-green-brand px-3 py-1.5 rounded">+ Add Lesson</button>
              </div>
              {form.lessons.map((l, idx) => {
                const thumb = ytThumb(l.videoUrl);
                const hasYt = !!ytId(l.videoUrl);
                return (
                  <div key={l.id} className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-green-brand font-bold">Lesson {idx + 1}</span>
                      <div className="flex gap-1 items-center">
                        <button type="button" onClick={() => moveLesson(idx, -1)} disabled={idx === 0} className="text-sm text-slate-400 disabled:opacity-30 px-2 py-0.5 hover:bg-white/10 rounded">↑</button>
                        <button type="button" onClick={() => moveLesson(idx, 1)} disabled={idx === form.lessons.length - 1} className="text-sm text-slate-400 disabled:opacity-30 px-2 py-0.5 hover:bg-white/10 rounded">↓</button>
                        <button type="button" onClick={() => removeLesson(idx)} className="text-red-400 text-xs ml-2 px-2 py-0.5 hover:bg-red-500/10 rounded">Remove</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
                      <div className="aspect-video rounded bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                        ) : (
                          <span className="text-[10px] text-slate-600 text-center px-2">Preview appears when YT URL added</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input value={l.title} onChange={e => updateLesson(idx, { title: e.target.value })}
                          placeholder="Lesson title" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm" />
                        <div className="relative">
                          <input value={l.videoUrl} onChange={e => updateLesson(idx, { videoUrl: e.target.value })}
                            placeholder="YouTube URL (Unlisted recommended) — or HLS/MP4" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 pr-16 text-white text-sm font-mono text-xs" />
                          {hasYt && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">YT ✓</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={l.duration} onChange={e => updateLesson(idx, { duration: e.target.value })}
                            placeholder="Duration (25:30)" className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-sm" />
                          <label className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 border border-white/10 rounded px-2 py-1.5">
                            <input type="checkbox" checked={l.isFree} onChange={e => updateLesson(idx, { isFree: e.target.checked })} className="accent-green-brand" />
                            Free Preview
                          </label>
                        </div>
                      </div>
                    </div>
                    <input value={l.description} onChange={e => updateLesson(idx, { description: e.target.value })}
                      placeholder="Short description (optional)" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs mt-2" />
                  </div>
                );
              })}
              {form.lessons.length === 0 && (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-lg p-8 text-center">
                  <p className="text-slate-500 text-sm mb-2">No lessons yet.</p>
                  <button onClick={addLesson} className="text-xs bg-green-brand/20 text-green-brand px-4 py-2 rounded">+ Add First Lesson</button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-white/10 mt-4">
          <button onClick={closeModal} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg">Cancel</button>
          <button onClick={save} className="flex-1 bg-green-brand hover:bg-green-600 text-white font-bold py-2.5 rounded-lg">
            {editing ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
