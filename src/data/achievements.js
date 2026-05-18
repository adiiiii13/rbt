const defaultAchievements = [
  {
    id: 'a1',
    studentName: 'Amit Kumar',
    course: 'IIT-JEE',
    result: 'AIR 245',
    year: '2025',
    description: 'Selected for IIT Bombay, Computer Science. 2-year integrated program student.',
    marks: '312/360',
  },
  {
    id: 'a2',
    studentName: 'Priya Verma',
    course: 'NEET',
    result: 'AIR 1200',
    year: '2025',
    description: 'Secured admission in AIIMS Delhi. First attempt success story.',
    marks: '695/720',
  },
  {
    id: 'a3',
    studentName: 'Rahul Sharma',
    course: 'Class 12 Boards',
    result: '98.4%',
    year: '2025',
    description: 'District topper in CBSE Class 12 Science stream examinations.',
    marks: '492/500',
  },
  {
    id: 'a4',
    studentName: 'Ananya Mishra',
    course: 'NEET',
    result: 'AIR 850',
    year: '2024',
    description: 'Selected for JIPMER Puducherry. Consistent top performer in mock tests.',
    marks: '701/720',
  },
  {
    id: 'a5',
    studentName: 'Vikash Singh',
    course: 'IIT-JEE',
    result: 'AIR 1560',
    year: '2024',
    description: 'Admitted to IIT Kanpur, Electrical Engineering. Rose from average to exceptional.',
    marks: '285/360',
  },
  {
    id: 'a6',
    studentName: 'Sneha Agarwal',
    course: 'Class 10 Boards',
    result: '99.2%',
    year: '2025',
    description: 'School topper and city rank holder. Foundation batch student since class 8.',
    marks: '496/500',
  },
  {
    id: 'a7',
    studentName: 'Rohan Joshi',
    course: 'Class 12 Boards',
    result: '96.8%',
    year: '2024',
    description: 'Secured 96.8% in PCM. Now preparing for JEE Advanced at RBT.',
    marks: '484/500',
  },
  {
    id: 'a8',
    studentName: 'Kavita Rani',
    course: 'NEET',
    result: 'AIR 3200',
    year: '2024',
    description: 'First-generation medical aspirant. Got admission in Government Medical College.',
    marks: '650/720',
  },
];

export function getAchievements() {
  const stored = localStorage.getItem('rbt_achievements');
  return stored ? JSON.parse(stored) : defaultAchievements;
}

export function saveAchievements(achievements) {
  localStorage.setItem('rbt_achievements', JSON.stringify(achievements));
}

export function resetAchievements() {
  localStorage.setItem('rbt_achievements', JSON.stringify(defaultAchievements));
  return defaultAchievements;
}

export { defaultAchievements };
