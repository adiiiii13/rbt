import { getPdfs } from '../../data/pdfs';

export default function StudentPdfs() {
  const pdfs = getPdfs();
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Online Test PDFs</h1>
      <p className="text-slate-400 text-sm mb-6"><span className="text-green-brand font-bold">Download</span> test papers and practice sets</p>
      <div className="bg-[#111111] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="table-container bg-[#111111]">
          <table>
            <thead><tr><th className="text-white">Title</th><th className="text-white">Class</th><th className="text-white">Subject</th><th className="text-white">Type</th><th className="text-white">Date</th><th className="text-white">Action</th></tr></thead>
            <tbody>
              {pdfs.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-white">{p.title}</td>
                  <td><span className="badge badge-green">{p.class}</span></td>
                  <td className="text-slate-300">{p.subject}</td>
                  <td className="text-slate-300">{p.examType}</td>
                  <td className="text-slate-400">{p.date}</td>
                  <td><button onClick={() => alert('Backend will be connected later.')} className="text-xs font-bold bg-green-brand text-white py-1.5 px-3 rounded-lg hover:bg-green-600 transition-all cursor-pointer inline-flex items-center gap-1">📥 Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
