const defaultTestimonials = [
  {
    id: 't1',
    name: 'Rahul Sharma',
    role: 'Student - Class 12',
    text: 'RBT Mission Learning transformed my preparation. The faculty explains every concept with such clarity that even difficult topics became easy. I scored 95% in boards!',
    rating: 5,
    type: 'student',
  },
  {
    id: 't2',
    name: 'Priya Verma',
    role: 'NEET Aspirant',
    text: 'The NEET batch at RBT is simply outstanding. The regular mock tests and doubt sessions helped me secure AIR 1200 in my first attempt.',
    rating: 5,
    type: 'student',
  },
  {
    id: 't3',
    name: 'Mrs. Sunita Gupta',
    role: 'Parent',
    text: 'My son has been studying at RBT since class 8. The personal attention and regular updates from teachers give us complete confidence in his preparation.',
    rating: 5,
    type: 'parent',
  },
  {
    id: 't4',
    name: 'Amit Kumar',
    role: 'JEE Advanced Qualifier',
    text: 'The problem-solving approach taught at RBT is unique. The teachers don\'t just teach formulas — they build deep understanding. Got into IIT Bombay!',
    rating: 5,
    type: 'student',
  },
  {
    id: 't5',
    name: 'Mr. Rajesh Patel',
    role: 'Parent',
    text: 'We compared many coaching institutes before choosing RBT. The results speak for themselves. Both my children have excelled in their board exams.',
    rating: 5,
    type: 'parent',
  },
  {
    id: 't6',
    name: 'Sneha Singh',
    role: 'Student - Class 10',
    text: 'I was weak in Mathematics but the foundation batch at RBT helped me build strong concepts. Now I actually enjoy solving math problems!',
    rating: 5,
    type: 'student',
  },
];

export function getTestimonials() {
  const stored = localStorage.getItem('rbt_testimonials');
  return stored ? JSON.parse(stored) : defaultTestimonials;
}

export function saveTestimonials(testimonials) {
  localStorage.setItem('rbt_testimonials', JSON.stringify(testimonials));
}

export function resetTestimonials() {
  localStorage.setItem('rbt_testimonials', JSON.stringify(defaultTestimonials));
  return defaultTestimonials;
}

export { defaultTestimonials };
