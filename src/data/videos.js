const defaultVideos = [
  {
    id: 'v1',
    title: 'Introduction to Organic Chemistry',
    subject: 'Chemistry',
    class: 'Class 11',
    duration: '45 min',
    thumbnail: 'https://img.youtube.com/vi/v4ZP8lDdPYk/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=v4ZP8lDdPYk',
    views: 1250,
    teacher: 'Dr. R.K. Tiwari',
    isFree: true,
  },
  {
    id: 'v2',
    title: "Newton's Laws of Motion",
    subject: 'Physics',
    class: 'Class 11',
    duration: '38 min',
    thumbnail: 'https://img.youtube.com/vi/kKKM8Y-u7ds/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
    views: 980,
    teacher: 'Prof. Sharma',
    isFree: true,
  },
  {
    id: 'v3',
    title: 'Quadratic Equations Masterclass',
    subject: 'Mathematics',
    class: 'Class 10',
    duration: '52 min',
    thumbnail: 'https://img.youtube.com/vi/i7idZfS8l8Q/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=i7idZfS8l8Q',
    views: 1540,
    teacher: 'Mr. Anil Verma',
    isFree: true,
  },
  {
    id: 'v4',
    title: 'Human Heart & Circulatory System',
    subject: 'Biology',
    class: 'Class 12',
    duration: '42 min',
    thumbnail: 'https://img.youtube.com/vi/Y5-5bNFMj3o/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=Y5-5bNFMj3o',
    views: 890,
    teacher: 'Dr. Meena Kumari',
    isFree: true,
  },
  {
    id: 'v5',
    title: 'JEE Advanced Problem Solving - Mechanics',
    subject: 'Physics',
    class: 'JEE',
    duration: '60 min',
    thumbnail: 'https://img.youtube.com/vi/OUtXrU0lv_U/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=OUtXrU0lv_U',
    views: 2100,
    teacher: 'Prof. Sharma',
    isFree: true,
  },
  {
    id: 'v6',
    title: 'NEET Biology - Genetics Basics',
    subject: 'Biology',
    class: 'NEET',
    duration: '48 min',
    thumbnail: 'https://img.youtube.com/vi/5MQdX6970vs/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=5MQdX6970vs',
    views: 1780,
    teacher: 'Dr. Meena Kumari',
    isFree: true,
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
