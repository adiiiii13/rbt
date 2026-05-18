const defaultStudents = [
  {
    id: 'STUDENT001',
    name: 'Rahul Sharma',
    email: 'rahul@rbt.com',
    password: 'student123',
    class: 'Class 12',
    course: 'IIT-JEE Preparation',
    phone: '9876543210',
    joinDate: '2025-04-15',
    status: 'Active',
  },
  {
    id: 'STUDENT002',
    name: 'Priya Verma',
    email: 'priya@rbt.com',
    password: 'student123',
    class: 'Class 12',
    course: 'NEET Preparation',
    phone: '9876543211',
    joinDate: '2025-03-20',
    status: 'Active',
  },
  {
    id: 'STUDENT003',
    name: 'Amit Kumar',
    email: 'amit@rbt.com',
    password: 'student123',
    class: 'Class 11',
    course: 'Class 11 Science',
    phone: '9876543212',
    joinDate: '2025-05-01',
    status: 'Active',
  },
  {
    id: 'STUDENT004',
    name: 'Sneha Singh',
    email: 'sneha@rbt.com',
    password: 'student123',
    class: 'Class 10',
    course: 'Class 10 Foundation',
    phone: '9876543213',
    joinDate: '2025-06-10',
    status: 'Active',
  },
  {
    id: 'STUDENT005',
    name: 'Vikash Patel',
    email: 'vikash@rbt.com',
    password: 'student123',
    class: 'Class 9',
    course: 'Class 9 Foundation',
    phone: '9876543214',
    joinDate: '2025-07-01',
    status: 'Inactive',
  },
];

export function getStudents() {
  const stored = localStorage.getItem('rbt_students');
  return stored ? JSON.parse(stored) : defaultStudents;
}

export function saveStudents(students) {
  localStorage.setItem('rbt_students', JSON.stringify(students));
}

export function resetStudents() {
  localStorage.setItem('rbt_students', JSON.stringify(defaultStudents));
  return defaultStudents;
}

export { defaultStudents };
