import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { openCheckout } from '../lib/razorpay';
import HlsPlayer from '../components/HlsPlayer';
import { Skeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [buying, setBuying] = useState(false);

  // Load course + check enrollment
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'courses', id));
        if (!alive) return;
        if (!snap.exists()) { toast.error('Course not found'); navigate('/courses'); return; }
        const data = { id: snap.id, ...snap.data() };
        setCourse(data);
        if (data.variants?.length) setSelectedVariant(data.variants[0]);

        if (user) {
          const q = query(
            collection(db, 'enrollments'),
            where('uid', '==', user.uid),
            where('courseId', '==', id),
          );
          const enrolSnap = await getDocs(q);
          if (!enrolSnap.empty) setEnrollment({ id: enrolSnap.docs[0].id, ...enrolSnap.docs[0].data() });
        }
      } catch (err) { toast.error(err.message); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id, user, navigate]);

  const lessons = useMemo(() => {
    if (!course?.lessons) return [];
    return [...course.lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [course]);

  const handleBuy = async () => {
    if (!user) { toast.error('Please login first'); navigate('/student-login'); return; }
    if (!selectedVariant) { toast.error('Select a plan'); return; }
    setBuying(true);
    openCheckout({
      amount: selectedVariant.price,
      courseId: course.id,
      courseTitle: course.title,
      name: 'RBT Mission Learning',
      description: `${course.title} — ${selectedVariant.months}-Month Plan`,
      variantMonths: selectedVariant.months,
      variantPrice: selectedVariant.price,
      user,
      onSuccess: (result) => {
        setEnrollment({
          id: result.enrollmentId,
          uid: user.uid,
          courseId: course.id,
          paymentId: result.paymentId,
        });
        toast.success('Enrolled! Start watching now.');
        setBuying(false);
      },
      onFailure: (err) => {
        toast.error(err.message);
        setBuying(false);
      },
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050B14] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Skeleton className="w-32 h-4 mb-6" />
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 animate-pulse">
          <div>
            <Skeleton className="w-full aspect-video rounded-2xl mb-6" />
            <Skeleton className="w-3/4 h-10 mb-3" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="w-20 h-6 rounded-full" />
              <Skeleton className="w-24 h-6 rounded-full" />
              <Skeleton className="w-24 h-6 rounded-full" />
            </div>
            <Skeleton className="w-full h-4 mb-2" />
            <Skeleton className="w-full h-4 mb-2" />
            <Skeleton className="w-2/3 h-4 mb-6" />
            <Skeleton className="w-1/3 h-6 mb-3" />
            <Skeleton className="w-full h-12 rounded-lg mb-2" />
            <Skeleton className="w-full h-12 rounded-lg mb-2" />
          </div>
          <aside>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <Skeleton className="w-1/2 h-6 mb-4" />
              <Skeleton className="w-full h-24 rounded-xl mb-3" />
              <Skeleton className="w-full h-24 rounded-xl mb-6" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

  if (!course) return null;

  // ─── Enrolled: show player ───
  if (enrollment && lessons.length > 0) {
    const lesson = lessons[currentLesson];
    return (
      <div className="min-h-screen bg-[#050B14]">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <Link to="/student/courses" className="text-slate-400 hover:text-white text-sm mb-4 inline-block no-underline">← My Courses</Link>
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div>
              <div className="bg-black rounded-2xl overflow-hidden mb-4">
                <HlsPlayer
                  key={lesson.id}
                  url={lesson.videoUrl}
                  watermark={user?.email || 'RBT'}
                  onEnded={() => currentLesson < lessons.length - 1 && setCurrentLesson(currentLesson + 1)}
                />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{lesson.title}</h1>
              <p className="text-sm text-slate-400">Lesson {currentLesson + 1} of {lessons.length} • {course.title}</p>
              {lesson.description && <p className="text-slate-300 mt-3">{lesson.description}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCurrentLesson(c => Math.max(0, c - 1))}
                  disabled={currentLesson === 0}
                  className="px-5 py-2.5 rounded-lg bg-white/5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentLesson(c => Math.min(lessons.length - 1, c + 1))}
                  disabled={currentLesson === lessons.length - 1}
                  className="px-5 py-2.5 rounded-lg bg-green-brand hover:bg-green-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next Lesson →
                </button>
              </div>
            </div>

            <aside className="bg-white/5 border border-white/10 rounded-2xl p-4 h-fit lg:sticky lg:top-4">
              <h3 className="text-white font-bold mb-3">Course Content</h3>
              <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                {lessons.map((l, idx) => (
                  <button
                    key={l.id}
                    onClick={() => setCurrentLesson(idx)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      idx === currentLesson
                        ? 'bg-green-brand/20 border border-green-brand text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{l.title}</div>
                        {l.duration && <div className="text-xs text-slate-500">{l.duration}</div>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not enrolled: show landing + buy ───
  return (
    <div className="min-h-screen bg-[#050B14] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/courses" className="text-slate-400 hover:text-white text-sm mb-6 inline-block no-underline">← Back to Courses</Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div>
            {course.thumbnail && <img src={course.thumbnail} alt={course.title} className="w-full rounded-2xl mb-6" />}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{course.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {course.level && <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{course.level}</span>}
              {course.duration && <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">{course.duration}</span>}
              {lessons.length > 0 && <span className="text-xs bg-green-brand/20 text-green-brand px-3 py-1 rounded-full">{lessons.length} lessons</span>}
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed">{course.description}</p>

            {course.subjects?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-bold mb-2">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {course.subjects.map(s => (
                    <span key={s} className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded text-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {lessons.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-bold mb-3">Course Curriculum</h3>
                <div className="space-y-2">
                  {lessons.map((l, idx) => (
                    <div key={l.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-white/10 text-xs flex items-center justify-center font-bold text-slate-300">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{l.title}</div>
                        {l.duration && <div className="text-xs text-slate-500">{l.duration}</div>}
                      </div>
                      {l.isFree ? (
                        <span className="text-xs bg-green-brand/20 text-green-brand px-2 py-1 rounded">Free Preview</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buy panel */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">Choose Your Plan</h3>

              {course.variants?.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {course.variants.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(v)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedVariant?.months === v.months
                          ? 'bg-green-brand/15 border-green-brand'
                          : 'bg-black/20 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white font-bold">{v.months}-Month Access</span>
                        {v.discount && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{v.discount}</span>}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">₹{v.price}</span>
                        {v.originalPrice && v.originalPrice > v.price && (
                          <span className="text-sm text-slate-500 line-through">₹{v.originalPrice}</span>
                        )}
                      </div>
                      {v.note && <p className="text-xs text-slate-400 mt-1">{v.note}</p>}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm mb-4">No plans configured yet.</p>
              )}

              <button
                onClick={handleBuy}
                disabled={!selectedVariant || buying}
                className="w-full bg-green-brand hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all"
              >
                {buying ? 'Processing...' : selectedVariant ? `Buy for ₹${selectedVariant.price}` : 'Select a plan'}
              </button>

              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">✓ Lifetime updates within plan</div>
                <div className="flex items-center gap-2">✓ Sequential video access</div>
                <div className="flex items-center gap-2">✓ Secure stream — no download</div>
              </div>
            </div>
          </aside>
        </motion.div>
      </div>
    </div>
  );
}
