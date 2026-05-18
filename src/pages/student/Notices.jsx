import { useEffect, useState } from 'react';
import { getNotices, defaultNotices } from '../../data/notices';
import { fetchNotices } from '../../lib/contentApi';
import { CalendarIcon } from '../../components/Icons';

export default function StudentNotices() {
  const [notices, setNotices] = useState(() => getNotices());
  useEffect(() => {
    let alive = true;
    fetchNotices(defaultNotices).then(data => { if (alive && data?.length) setNotices(data); });
    return () => { alive = false; };
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-1">Notices</h1>
      <p className="text-slate-500 text-sm mb-6">Stay updated with latest announcements</p>
      <div className="space-y-4">
        {notices.map((n) => (
          <div key={n.id} className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${n.priority === 'high' ? 'bg-red-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                <h3 className="font-bold text-navy">{n.title}</h3>
              </div>
              <span className={`badge ${n.priority === 'high' ? 'badge-red' : n.priority === 'medium' ? 'badge-gold' : 'badge-green'}`}>{n.priority}</span>
            </div>
            <p className="text-sm text-slate-600 mb-2">{n.content}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400"><span className="inline-flex items-center gap-1"><CalendarIcon size={12} /> {n.date}</span><span className="badge badge-navy">{n.category}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
