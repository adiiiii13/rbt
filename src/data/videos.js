const defaultVideos = [
  {
    id: 'v1',
    title: 'Introduction to Organic Chemistry',
    subject: 'Chemistry',
    class: 'Class 11',
    duration: '45 min',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    videoUrl: '#',
    views: 1250,
    teacher: 'Dr. R.K. Tiwari',
  },
  {
    id: 'v2',
    title: 'Newton\'s Laws of Motion',
    subject: 'Physics',
    class: 'Class 11',
    duration: '38 min',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    videoUrl: '#',
    views: 980,
    teacher: 'Prof. Sharma',
  },
  {
    id: 'v3',
    title: 'Quadratic Equations Masterclass',
    subject: 'Mathematics',
    class: 'Class 10',
    duration: '52 min',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    videoUrl: '#',
    views: 1540,
    teacher: 'Mr. Anil Verma',
  },
  {
    id: 'v4',
    title: 'Human Heart & Circulatory System',
    subject: 'Biology',
    class: 'Class 12',
    duration: '42 min',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    videoUrl: '#',
    views: 890,
    teacher: 'Dr. Meena Kumari',
  },
  {
    id: 'v5',
    title: 'JEE Advanced Problem Solving - Mechanics',
    subject: 'Physics',
    class: 'JEE',
    duration: '60 min',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    videoUrl: '#',
    views: 2100,
    teacher: 'Prof. Sharma',
  },
  {
    id: 'v6',
    title: 'NEET Biology - Genetics Basics',
    subject: 'Biology',
    class: 'NEET',
    duration: '48 min',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    videoUrl: '#',
    views: 1780,
    teacher: 'Dr. Meena Kumari',
  },
];

export function getVideos() {
  const stored = localStorage.getItem('rbt_videos');
  return stored ? JSON.parse(stored) : defaultVideos;
}

export function saveVideos(videos) {
  localStorage.setItem('rbt_videos', JSON.stringify(videos));
}

export function resetVideos() {
  localStorage.setItem('rbt_videos', JSON.stringify(defaultVideos));
  return defaultVideos;
}

export { defaultVideos };
