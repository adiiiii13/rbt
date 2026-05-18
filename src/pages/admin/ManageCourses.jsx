import { useState } from 'react';
import Modal from '../../components/Modal';
import { getCourses, saveCourses } from '../../data/courses';
import { BookOpenIcon, FlaskIcon, GraduationCapIcon, RocketIcon, HeartPulseIcon } from '../../components/Icons';

const iconMap = {
  BookOpen: BookOpenIcon,
  Flask: FlaskIcon,
  GraduationCap: GraduationCapIcon,
  Rocket: RocketIcon,
  HeartPulse: HeartPulseIcon,
};

export default function ManageCourses() {
  const [courses, setCourses] = useState(getCourses());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', subjects: '', level: 'Foundation', duration: '12 Months', students: 0, image: 'BookOpen', color: '#3b82f6' });

  const save = () => {
    const subjectsArr = form.subjects.split(',').map(s => s.trim()).filter(Boolean);
    if (editing) {
      const updated = courses.map(c => c.id === editing.id ? { ...c, ...form, subjects: subjectsArr } : c);
      setCourses(updated); saveCourses(updated);
    } else {
      const newCourse = { ...form, id: `c_${Date.now()}`, subjects: subjectsArr, students: Number(form.students) };
      const updated = [...courses, newCourse];
      setCourses(updated); saveCourses(updated);
    }
    closeModal();
  };

  const remove = (id) => { const updated = courses.filter(c => c.id !== id); setCourses(updated); saveCourses(updated); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c, subjects: c.subjects.join(', ') }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm({ title: '', description: '', subjects: '', level: 'Foundation', duration: '12 Months', students: 0, image: 'BookOpen', color: '#3b82f6' }); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage Courses</h1><p className="text-sm text-slate-400">{courses.length} courses</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Course</button>
      </div>
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th></th><th>Title</th><th>Level</th><th>Duration</th><th>Students</th><th>Actions</th></tr></thead>
            <tbody>{courses.map(c => {
              const IconComponent = iconMap[c.image] || BookOpenIcon;
              return (
              <tr key={c.id}>
                <td className="text-xl"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.color}15`, color: c.color }}><IconComponent size={20} /></div></td>
                <td className="font-medium text-white">{c.title}</td>
                <td><span className="badge badge-green">{c.level}</span></td>
                <td>{c.duration}</td>
                <td>{c.students}</td>
                <td><div className="flex gap-2"><button onClick={() => openEdit(c)} className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">Edit</button><button onClick={() => remove(c.id)} className="text-sm text-red-600 hover:text-red-800 cursor-pointer">Delete</button></div></td>
              </tr>
            )})}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit Course' : 'Add Course'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Description</label><textarea rows={3} className="input-field" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Subjects (comma separated)</label><input className="input-field" value={form.subjects} onChange={e => setForm({...form, subjects: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Level</label><select className="input-field" value={form.level} onChange={e => setForm({...form, level: e.target.value})}><option>Foundation</option><option>Intermediate</option><option>Competitive</option></select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Duration</label><input className="input-field" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Icon</label>
            <select className="input-field" value={form.image} onChange={e => setForm({...form, image: e.target.value})}>
              <option value="BookOpen">Book</option>
              <option value="Flask">Flask</option>
              <option value="GraduationCap">Graduation Cap</option>
              <option value="Rocket">Rocket</option>
              <option value="HeartPulse">Heart</option>
            </select>
            </div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Color</label><input type="color" className="input-field h-[46px]" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
          </div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'} Course</button>
        </div>
      </Modal>
    </div>
  );
}
