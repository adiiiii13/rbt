import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteItemSmart } from '../../lib/contentApi';
import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { addDocument, updateDocument } from '../../lib/firebaseHelpers';
import { defaultCourses } from '../../data/courses';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon } from '../../components/Icons';

const iconMap = { BookOpen: BookOpenIcon, Flask: FlaskIcon, GraduationCap: GraduationCapIcon, Rocket: RocketIcon, HeartPulse: HeartPulseIcon };

const emptyForm = { title: '', description: '', subjects: '', level: 'Foundation', duration: '12 Months', students: 0, image: 'BookOpen', color: '#3b82f6' };

export default function ManageCourses() {
  const { data: coursesRaw, loading } = useRealtimeCollection('courses', { fallback: defaultCourses });
  const courses = coursesRaw?.length ? coursesRaw : defaultCourses;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const save = async () => {
    const subjectsArr = form.subjects.split(',').map(s => s.trim()).filter(Boolean);
    const payload = { ...form, subjects: subjectsArr, students: Number(form.students) };
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

  const openEdit = (c) => { setEditing(c); setForm({ ...c, subjects: (c.subjects || []).join(', ') }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Courses</h1><p className="text-sm text-slate-400">{courses.length} courses</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Course</button>
      </div>
      {loading && <div className="text-slate-400 text-sm mb-4">Loading...</div>}
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th></th><th>Title</th><th>Level</th><th>Duration</th><th>Students</th><th>Actions</th></tr></thead>
            <tbody>{courses.map(c => {
              const IconComponent = iconMap[c.image] || BookOpenIcon;
              return (
              <tr key={c.id}>
                <td><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: (c.color || '#3b82f6') + '20' }}><IconComponent size={16} style={{ color: c.color || '#3b82f6' }} /></div></td>
                <td className="font-medium text-white">{c.title}</td>
                <td><span className="badge badge-navy">{c.level}</span></td>
                <td>{c.duration}</td>
                <td>{c.students}</td>
                <td><div className="flex gap-2"><button onClick={() => openEdit(c)} className="text-sm text-blue-600 cursor-pointer">Edit</button><button onClick={() => remove(c.id)} className="text-sm text-red-600 cursor-pointer">Delete</button></div></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Course' : 'Add Course'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Description</label><textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Level</label><select className="input-field" value={form.level} onChange={e => setForm({...form, level: e.target.value})}>{['Foundation','Intermediate','Competitive'].map(l => <option key={l}>{l}</option>)}</select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Duration</label><input className="input-field" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Students</label><input type="number" className="input-field" value={form.students} onChange={e => setForm({...form, students: e.target.value})} /></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Color</label><input type="color" className="input-field h-10" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
          </div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Subjects (comma separated)</label><input className="input-field" value={form.subjects} onChange={e => setForm({...form, subjects: e.target.value})} /></div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'} Course</button>
        </div>
      </Modal>
    </div>
  );
}
