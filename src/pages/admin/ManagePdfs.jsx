import { useState } from 'react';
import Modal from '../../components/Modal';
import { getPdfs, savePdfs } from '../../data/pdfs';
import { FileTextIcon } from '../../components/Icons';

export default function ManagePdfs() {
  const [pdfs, setPdfs] = useState(getPdfs());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', class: 'Class 10', subject: '', examType: 'Unit Test', date: '', fileName: '' });

  const save = () => {
    if (editing) {
      const updated = pdfs.map(p => p.id === editing.id ? { ...p, ...form } : p);
      setPdfs(updated); savePdfs(updated);
    } else {
      const newPdf = { ...form, id: `p_${Date.now()}`, downloads: 0 };
      const updated = [...pdfs, newPdf];
      setPdfs(updated); savePdfs(updated);
    }
    closeModal();
  };

  const remove = (id) => { const updated = pdfs.filter(p => p.id !== id); setPdfs(updated); savePdfs(updated); };
  const openEdit = (p) => { setEditing(p); setForm({ title: p.title, class: p.class, subject: p.subject, examType: p.examType, date: p.date, fileName: p.fileName }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm({ title: '', class: 'Class 10', subject: '', examType: 'Unit Test', date: '', fileName: '' }); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Manage PDFs</h1><p className="text-sm text-slate-400">{pdfs.length} test papers</p></div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add PDF</button>
      </div>
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container">
          <table>
            <thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Type</th><th><span className="text-white">Downloads</span></th><th>Actions</th></tr></thead>
            <tbody>{pdfs.map(p => (
              <tr key={p.id}>
                <td className="font-medium text-white">{p.title}</td>
                <td><span className="badge badge-green">{p.class}</span></td>
                <td>{p.subject}</td>
                <td>{p.examType}</td>
                <td>{p.downloads}</td>
                <td><div className="flex gap-2"><button onClick={() => openEdit(p)} className="text-sm text-blue-600 cursor-pointer">Edit</button><button onClick={() => remove(p.id)} className="text-sm text-red-600 cursor-pointer">Delete</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={modal} onClose={closeModal} title={editing ? 'Edit PDF' : 'Add PDF'}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-300 mb-1 block">Title</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Class</label><select className="input-field" value={form.class} onChange={e => setForm({...form, class: e.target.value})}>{['Class 8','Class 9','Class 10','Class 11','Class 12','JEE','NEET'].map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Subject</label><input className="input-field" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Exam Type</label><select className="input-field" value={form.examType} onChange={e => setForm({...form, examType: e.target.value})}><option>Unit Test</option><option>Chapter Test</option><option>Mock Test</option><option>Practice Paper</option><option>Annual Exam</option><option>Worksheet</option><option>Full Mock</option></select></div>
            <div><label className="text-sm font-medium text-slate-300 mb-1 block">Date</label><input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Upload PDF (Demo)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-green-brand transition-colors" onClick={() => setForm({...form, fileName: `test_${Date.now()}.pdf`})}>
              {form.fileName ? <p className="text-sm text-green-brand inline-flex items-center gap-1"><FileTextIcon size={14} /> {form.fileName}</p> : <p className="text-sm text-slate-400">Click to simulate file upload</p>}
            </div>
          </div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Add'} PDF</button>
        </div>
      </Modal>
    </div>
  );
}
