const defaultCourses = [
  {
    id: 'c1',
    title: 'Class 8 Foundation',
    description: 'Build a strong academic base with fundamentals in Science, Maths, and English — setting the stage for competitive success.',
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies'],
    level: 'Foundation',
    duration: '12 Months',
    students: 124,
    image: 'BookOpen',
    color: '#3b82f6',
  },
  {
    id: 'c2',
    title: 'Class 9 Foundation',
    description: 'Strengthen concepts with advanced problem-solving techniques and early exposure to competitive exam patterns.',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
    level: 'Foundation',
    duration: '12 Months',
    students: 156,
    image: 'BookOpen',
    color: '#22c55e',
  },
  {
    id: 'c3',
    title: 'Class 10 Foundation',
    description: 'Board exam mastery combined with competitive readiness. Complete NCERT with advanced practice.',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
    level: 'Foundation',
    duration: '12 Months',
    students: 198,
    image: 'BookOpen',
    color: '#f59e0b',
  },
  {
    id: 'c4',
    title: 'Class 11 Science',
    description: 'Deep dive into PCM/PCB with rigorous conceptual clarity and numerical problem-solving for boards and beyond.',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    level: 'Intermediate',
    duration: '12 Months',
    students: 210,
    image: 'Flask',
    color: '#8b5cf6',
  },
  {
    id: 'c5',
    title: 'Class 12 Science',
    description: 'Board exam excellence and competitive entrance preparation running in parallel for maximum results.',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    level: 'Intermediate',
    duration: '12 Months',
    students: 245,
    image: 'GraduationCap',
    color: '#0ea5e9',
  },
  {
    id: 'c6',
    title: 'IIT-JEE Preparation',
    description: 'Intensive JEE Main & Advanced preparation with expert faculty, test series, and personalized mentoring.',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    level: 'Competitive',
    duration: '24 Months',
    students: 180,
    image: 'Rocket',
    color: '#ef4444',
  },
  {
    id: 'c7',
    title: 'NEET Preparation',
    description: 'Comprehensive NEET coaching with biology-focused pedagogy, NCERT mastery, and regular mock tests.',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    level: 'Competitive',
    duration: '24 Months',
    students: 165,
    image: 'HeartPulse',
    color: '#16a34a',
  },
];

export function getCourses() {
  const stored = localStorage.getItem('rbt_courses');
  return stored ? JSON.parse(stored) : defaultCourses;
}

export function saveCourses(courses) {
  localStorage.setItem('rbt_courses', JSON.stringify(courses));
}

export function resetCourses() {
  localStorage.setItem('rbt_courses', JSON.stringify(defaultCourses));
  return defaultCourses;
}

export { defaultCourses };
