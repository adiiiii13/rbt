import { seedCollection } from './firebaseHelpers'

export async function seedAll() {
  console.log('Seeding Firestore...')
  const [
    { defaultCourses },
    { defaultVideos },
    { defaultPdfs },
    { defaultStudents },
    { defaultAchievements },
    { defaultTestimonials },
    { defaultNotices },
  ] = await Promise.all([
    import('../data/courses'),
    import('../data/videos'),
    import('../data/pdfs'),
    import('../data/students'),
    import('../data/achievements'),
    import('../data/testimonials'),
    import('../data/notices'),
  ])

  const results = {}
  results.courses = await seedCollection('courses', defaultCourses)
  const videosWithFree = defaultVideos.map(v => ({ ...v, isFree: true, price: 0 }))
  results.videos = await seedCollection('videos', videosWithFree)
  results.pdfs = await seedCollection('pdfs', defaultPdfs)
  results.students = await seedCollection('students', defaultStudents)
  results.achievements = await seedCollection('achievements', defaultAchievements)
  results.testimonials = await seedCollection('testimonials', defaultTestimonials)
  results.notices = await seedCollection('notices', defaultNotices)
  console.log('Seed result:', results)
  return results
}
