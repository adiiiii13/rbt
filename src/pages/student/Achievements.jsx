import { useRealtimeCollection } from '../../lib/useRealtimeCollection';
import { defaultAchievements } from '../../data/achievements';
import { TrophyIcon } from '../../components/Icons';

export default function StudentAchievements() {
  const { data: achievementsRaw } = useRealtimeCollection('achievements', { fallback: defaultAchievements });
  const achievements = achievementsRaw?.length ? achievementsRaw : defaultAchievements;
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Achievements</h1>
      <p className="text-slate-400 text-sm mb-6">Our top performers and their results</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map(a => (
          <div key={a.id} className="bg-[#111111] rounded-2xl p-6 border border-slate-800 text-center">
            <div className="w-14 h-14 rounded-full bg-green-brand/10 flex items-center justify-center text-green-brand mx-auto mb-3"><TrophyIcon size={24} /></div>
            <h3 className="font-bold text-white">{a.studentName}</h3>
            <p className="text-green-brand font-semibold text-lg">{a.result}</p>
            <p className="text-sm text-slate-400">{a.course} • {a.marks}</p>
            <p className="text-xs text-slate-500 mt-2">{a.description}</p>
            <span className="badge badge-gold mt-3">{a.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
