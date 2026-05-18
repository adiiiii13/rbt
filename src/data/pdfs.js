const defaultPdfs = [
  {
    id: 'p1',
    title: 'Mathematics Unit Test - Algebra',
    class: 'Class 10',
    subject: 'Mathematics',
    examType: 'Unit Test',
    date: '2026-04-15',
    fileName: 'math_algebra_test.pdf',
    downloads: 342,
  },
  {
    id: 'p2',
    title: 'Physics Chapter Test - Optics',
    class: 'Class 12',
    subject: 'Physics',
    examType: 'Chapter Test',
    date: '2026-04-10',
    fileName: 'physics_optics_test.pdf',
    downloads: 289,
  },
  {
    id: 'p3',
    title: 'Chemistry Practice Paper - Organic',
    class: 'Class 11',
    subject: 'Chemistry',
    examType: 'Practice Paper',
    date: '2026-04-08',
    fileName: 'chemistry_organic_practice.pdf',
    downloads: 215,
  },
  {
    id: 'p4',
    title: 'Biology Mock Test - Human Physiology',
    class: 'Class 12',
    subject: 'Biology',
    examType: 'Mock Test',
    date: '2026-03-28',
    fileName: 'biology_physiology_mock.pdf',
    downloads: 178,
  },
  {
    id: 'p5',
    title: 'JEE Main Mock Test - Set A',
    class: 'JEE',
    subject: 'PCM Combined',
    examType: 'Full Mock',
    date: '2026-03-20',
    fileName: 'jee_main_mock_a.pdf',
    downloads: 456,
  },
  {
    id: 'p6',
    title: 'NEET Practice Paper - Set 1',
    class: 'NEET',
    subject: 'PCB Combined',
    examType: 'Practice Paper',
    date: '2026-03-15',
    fileName: 'neet_practice_set1.pdf',
    downloads: 398,
  },
  {
    id: 'p7',
    title: 'Class 9 Science Annual Paper',
    class: 'Class 9',
    subject: 'Science',
    examType: 'Annual Exam',
    date: '2026-03-10',
    fileName: 'class9_science_annual.pdf',
    downloads: 267,
  },
  {
    id: 'p8',
    title: 'Mathematics Worksheet - Trigonometry',
    class: 'Class 10',
    subject: 'Mathematics',
    examType: 'Worksheet',
    date: '2026-03-05',
    fileName: 'math_trigonometry_ws.pdf',
    downloads: 312,
  },
];

export function getPdfs() {
  const stored = localStorage.getItem('rbt_pdfs');
  return stored ? JSON.parse(stored) : defaultPdfs;
}

export function savePdfs(pdfs) {
  localStorage.setItem('rbt_pdfs', JSON.stringify(pdfs));
}

export function resetPdfs() {
  localStorage.setItem('rbt_pdfs', JSON.stringify(defaultPdfs));
  return defaultPdfs;
}

export { defaultPdfs };
