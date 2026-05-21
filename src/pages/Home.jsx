import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import anime from 'animejs';
import { useRealtimeCollection } from '../lib/useRealtimeCollection';
import { defaultCourses } from '../data/courses';
import { defaultTestimonials } from '../data/testimonials';
import { defaultAchievements } from '../data/achievements';
import {
  UsersIcon, TrendingUpIcon, TrophyIcon, CalendarIcon,
  BookOpenIcon, RocketIcon, HeartPulseIcon, PlayCircleIcon,
  GraduationCapIcon, StarIcon, FlaskIcon, TargetIcon
} from '../components/Icons';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const AnimatedCounter = ({ value, suffix }) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          anime({
            targets: nodeRef.current,
            innerHTML: [0, value],
            easing: 'easeOutExpo',
            duration: 2500,
            round: 1,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    
    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }
    
    return () => observer.disconnect();
  }, [value]);

  return (
    <span>
      <span ref={nodeRef}>0</span>{suffix}
    </span>
  );
};

export default function Home({ onOpenLogin }) {
  const floatingRef = useRef(null);

  useEffect(() => {
    if (floatingRef.current) {
      anime({
        targets: floatingRef.current.querySelectorAll('.float-icon'),
        translateY: [-15, 15],
        duration: 3000,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        delay: anime.stagger(400),
      });
    }
  }, []);

  const { data: coursesRaw } = useRealtimeCollection('courses', { fallback: defaultCourses });
  const { data: testimonialsRaw } = useRealtimeCollection('testimonials', { fallback: defaultTestimonials });
  const { data: achievementsRaw } = useRealtimeCollection('achievements', { fallback: defaultAchievements });
  const courses = coursesRaw?.length ? coursesRaw : defaultCourses;
  const testimonials = testimonialsRaw?.length ? testimonialsRaw : defaultTestimonials;
  const achievementsAll = achievementsRaw?.length ? achievementsRaw : defaultAchievements;
  const achievements = achievementsAll.slice(0, 4);

  const stats = [
    { value: 1200, suffix: '+', label: 'Students Enrolled', icon: <UsersIcon size={28} /> },
    { value: 95, suffix: '%', label: 'Board Success Rate', icon: <TrendingUpIcon size={28} /> },
    { value: 50, suffix: '+', label: 'IIT/NEET Selections', icon: <TrophyIcon size={28} /> },
    { value: 10, suffix: '+', label: 'Years Experience', icon: <CalendarIcon size={28} /> },
  ];

  const courseIconMap = {
    c1: <BookOpenIcon size={26} />,
    c2: <BookOpenIcon size={26} />,
    c3: <BookOpenIcon size={26} />,
    c4: <FlaskIcon size={26} />,
    c5: <GraduationCapIcon size={26} />,
    c6: <RocketIcon size={26} />,
    c7: <HeartPulseIcon size={26} />,
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-[#050B14] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/Images/Image-1.webp"
            alt="Hero Background"
            width="1214"
            height="911"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050B14]/80 via-[#050B14]/60 to-[#050B14]"></div>
        </div>

        {/* Advanced Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Glowing Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-green-brand/15 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-blue-600/10 rounded-full blur-[100px]"
          />
        </div>

        {/* Floating Icons */}
        <div ref={floatingRef} className="absolute inset-0 pointer-events-none hidden md:block">
          <span className="float-icon absolute top-[20%] left-[12%] text-white/10 backdrop-blur-sm bg-white/5 p-4 rounded-2xl border border-white/10 shadow-2xl shadow-green-brand/5"><BookOpenIcon size={32} /></span>
          <span className="float-icon absolute top-[25%] right-[15%] text-white/10 backdrop-blur-sm bg-white/5 p-4 rounded-2xl border border-white/10 shadow-2xl shadow-blue-500/5"><GraduationCapIcon size={40} /></span>
          <span className="float-icon absolute bottom-[30%] left-[18%] text-white/10 backdrop-blur-sm bg-white/5 p-3 rounded-2xl border border-white/10"><TargetIcon size={28} /></span>
          <span className="float-icon absolute bottom-[25%] right-[12%] text-white/10 backdrop-blur-sm bg-white/5 p-4 rounded-2xl border border-white/10"><FlaskIcon size={32} /></span>
        </div>

        <div className="container-main relative z-10 pt-44 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-md bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-xl text-green-light text-sm font-semibold mb-8 hover:bg-white/5 transition-colors cursor-default"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-brand shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              </span>
              Admissions Open for 2026-27
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-3xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 font-[var(--font-heading)] tracking-tight drop-shadow-2xl"
            >
              RBT{' '}
              <span className="relative inline-block">
                <span className="absolute -inset-2 bg-green-brand/30 blur-2xl rounded-full"></span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-brand to-teal-400">
                  MISSION
                </span>
              </span>{' '}
              LEARNING
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-base sm:text-2xl text-slate-300 font-medium mb-6 italic drop-shadow-md px-4"
            >
              &ldquo;Mission Hai Toh Perfect Learning Chahiye&rdquo;
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex items-center justify-center gap-2 sm:gap-6 text-[10px] sm:text-lg text-slate-400 mb-10 max-w-2xl mx-auto font-medium"
            >
              <span className="bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 shadow-inner">Foundation 8–12</span>
              <span className="w-1 h-1 rounded-full bg-green-brand/50" />
              <span className="bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 shadow-inner">IIT-JEE</span>
              <span className="w-1 h-1 rounded-full bg-green-brand/50" />
              <span className="bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 shadow-inner">NEET</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5"
            >
              <button 
                onClick={onOpenLogin}
                className="group relative overflow-hidden btn-primary !px-8 !py-4 !text-base no-underline w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <GraduationCapIcon size={20} /> Student Login
              </button>
              <Link to="/courses" className="group text-white hover:text-green-brand font-medium no-underline w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 transition-colors">
                View Courses <BookOpenIcon size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Dynamic Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden line-height-0 transform translate-y-[1px]">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[60px] sm:h-[80px]">
            <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,60 L1440,120 L0,120 Z" fill="#000000"/>
            <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,60 L1440,120 L0,120 Z" fill="url(#wave-gradient)" className="opacity-20"/>
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#000000]">
        <div className="container-main">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6 text-center hover:scale-105 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-all duration-300 border border-transparent hover:border-green-brand/30"
              >
                <div className="text-green-brand mb-3 flex justify-center transform group-hover:scale-110 transition-transform duration-300">{stat.icon}</div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </h3>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 bg-[#000000]">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <span className="badge badge-green mb-4">About Us</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-[var(--font-heading)]">
                Where <span className="text-green-brand">Dreams</span> Meet{' '}
                <span className="text-green-brand">Discipline</span>
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                RBT Mission Learning is a premier coaching institute dedicated to transforming students into achievers. With a decade of experience in shaping young minds, we offer comprehensive programs for foundation classes 8–12, IIT-JEE, and NEET preparation.
              </p>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Our unique blend of expert faculty, personalized mentoring, online test series, and demo video lectures ensures that every student receives the perfect learning experience.
              </p>
              <Link to="/about" className="btn-primary no-underline">
                Learn More →
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-green-brand/20 to-blue-500/20 rounded-[32px] blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-700"></div>
              <div className="relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-white/5 aspect-[4/3] lg:aspect-auto lg:h-[500px]">
                <motion.img
                  src="/Images/Image-2.webp"
                  alt="RBT Mission Learning Campus"
                  width="685"
                  height="559"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                
                {/* Floating Info Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="absolute bottom-8 left-8 right-8 p-6 backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 shadow-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-brand flex items-center justify-center text-white shadow-lg shadow-green-brand/20">
                      <GraduationCapIcon size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg leading-tight">Advanced Campus</h4>
                      <p className="text-white/70 text-sm">Empowering students with the best resources</p>
                    </div>
                  </div>
                </motion.div>

                {/* Animated Light Sweep */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-brand/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="py-20 bg-[#000000]">
        <div className="container-main">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="badge badge-green mb-4">Our Programs</span>
            <h2 className="section-title">Explore Our Courses</h2>
            <p className="section-subtitle">
              Comprehensive programs designed to help every student achieve academic excellence
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.slice(0, 4).map((course, i) => (
              <motion.div
                key={course.id}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6 group cursor-pointer hover:-translate-y-2 hover:border-green-brand/40 hover:shadow-[0_10px_30px_rgba(34,197,94,0.15)] transition-all duration-300"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${course.color}15`, color: course.color }}
                >
                  {courseIconMap[course.id] || <BookOpenIcon size={26} />}
                </div>
                <h3 className="font-bold text-white mb-2">{course.title}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{course.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(course.subjects || []).slice(0, 3).map((s) => (
                    <span key={s} className="text-xs px-2 py-1 rounded-md bg-white/10 text-slate-300">{s}</span>
                  ))}
                </div>
                <Link
                  to="/courses"
                  className="text-sm font-medium text-green-brand hover:text-green-dark transition-colors no-underline"
                >
                  View Details →
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="text-center mt-10">
            <Link to="/courses" className="btn-primary no-underline">
              View All Courses →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Achievements Preview */}
      <section className="py-20 bg-navy text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-brand/10 rounded-full blur-[100px]" />
        </div>
        <div className="container-main relative z-10">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="badge badge-gold mb-4">Our Pride</span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-[var(--font-heading)]">
              Student Achievements
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Our students consistently deliver outstanding results in boards and competitive exams
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.id}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-dark p-6 text-center cursor-pointer hover:-translate-y-2 hover:bg-white/[0.05] border border-transparent hover:border-green-brand/30 hover:shadow-[0_10px_30px_rgba(34,197,94,0.1)] transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-full bg-green-brand/20 flex items-center justify-center text-green-light mx-auto mb-4 transform group-hover:scale-110 group-hover:bg-green-brand/30 transition-all duration-300">
                  <TrophyIcon size={24} />
                </div>
                <h4 className="font-bold text-lg mb-1">{ach.studentName}</h4>
                <p className="text-green-light font-semibold text-sm mb-1">{ach.result}</p>
                <p className="text-slate-400 text-sm mb-2">{ach.course}</p>
                <span className="badge badge-gold">{ach.year}</span>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="text-center mt-10">
            <Link to="/achievements" className="btn-primary no-underline">
              View All Achievements →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-20 bg-[#050B14]">
        <div className="container-main">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="badge badge-green mb-4">Gallery</span>
            <h2 className="section-title">Campus Life & Facilities</h2>
            <p className="section-subtitle">
              Take a glimpse into the vibrant learning environment at RBT Mission Learning
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              {...stagger}
              transition={{ duration: 0.5 }}
              className="md:col-span-2 lg:col-span-2 group relative rounded-[32px] overflow-hidden aspect-[16/9] bg-white/5 cursor-pointer border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10"></div>
              <img
                src="/Images/Image-2.webp"
                alt="Main Campus"
                width="685"
                height="559"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute bottom-8 left-8 z-20">
                <h3 className="text-2xl font-bold text-white mb-2">Modern Classrooms</h3>
                <p className="text-white/70">Equipped with latest technology for better understanding</p>
              </div>
            </motion.div>
            
            <motion.div
              {...stagger}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative rounded-[32px] overflow-hidden aspect-square bg-white/5 cursor-pointer border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop" 
                alt="Library"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-lg font-bold text-white">Digital Library</h3>
              </div>
            </motion.div>
          </div>

          <motion.div {...fadeUp} className="text-center mt-10">
            <Link to="/gallery" className="btn-primary no-underline">
              View Full Gallery →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-20 bg-[#000000]">
        <div className="container-main">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="badge badge-green mb-4">Testimonials</span>
            <h2 className="section-title">What Our Students Say</h2>
            <p className="section-subtitle">
              Hear directly from our students and parents about their journey with us
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t, i) => (
              <motion.div
                key={t.id}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6 cursor-pointer hover:scale-105 hover:shadow-[0_10px_40px_rgba(34,197,94,0.1)] border border-white/5 hover:border-green-brand/20 transition-all duration-300 group"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(Math.max(0, t.rating || 0))].map((_, j) => (
                    <StarIcon key={j} size={16} className="text-accent-gold" />
                  ))}
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-green-brand/20 flex items-center justify-center text-green-light font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{t.name}</h4>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-brand to-green-dark text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
        </div>
        <div className="container-main relative z-10 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-[var(--font-heading)]">
              Start Your Journey Today
            </h2>
            <p className="text-white/80 max-w-lg mx-auto mb-8 text-lg">
              Join thousands of successful students who trusted RBT Mission Learning for their academic growth.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact" className="btn-navy !bg-white !text-green-dark no-underline inline-flex items-center gap-2">
                Contact Us
              </Link>
              <Link to="/courses" className="btn-secondary no-underline inline-flex items-center gap-2">
                Explore Courses
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
