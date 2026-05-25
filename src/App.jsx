import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import OfferPopup from './components/OfferPopup'
import ProfilePopup from './components/ProfilePopup'
import { GridSkeleton } from './components/ui/Skeleton'

// Public Pages (lazy)
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Videos = lazy(() => import('./pages/Videos'))
const Achievements = lazy(() => import('./pages/Achievements'))
const TestPapers = lazy(() => import('./pages/TestPapers'))
const TestPapersDownloadable = lazy(() => import('./pages/TestPapersDownloadable'))
const TestPapersMock = lazy(() => import('./pages/TestPapersMock'))
const MockTestRunner = lazy(() => import('./pages/MockTestRunner'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Contact = lazy(() => import('./pages/Contact'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const Counselling = lazy(() => import('./pages/Counselling'))
const StudentLogin = lazy(() => import('./pages/StudentLogin'))
const StudentSignup = lazy(() => import('./pages/StudentSignup'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const NotFound = lazy(() => import('./pages/NotFound'))
const WatchVideo = lazy(() => import('./pages/WatchVideo'))
const ApplyTeacher = lazy(() => import('./pages/ApplyTeacher'))

// Student Pages (lazy)
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const StudentCourses = lazy(() => import('./pages/student/Courses'))
const AllCourses = lazy(() => import('./pages/student/AllCourses'))
const StudentPdfs = lazy(() => import('./pages/student/Pdfs'))
const StudyMaterial = lazy(() => import('./pages/student/StudyMaterial'))
const StudentVideos = lazy(() => import('./pages/student/Videos'))
const StudentNotices = lazy(() => import('./pages/student/Notices'))
const StudentAchievements = lazy(() => import('./pages/student/Achievements'))
const StudentCounselling = lazy(() => import('./pages/student/Counselling'))
const Payment = lazy(() => import('./pages/student/Payment'))
const Invoices = lazy(() => import('./pages/student/Invoices'))
const StudentDoubts = lazy(() => import('./pages/student/Doubts'))
const StudentMockResults = lazy(() => import('./pages/student/MockResults'))
const StudentMyTests = lazy(() => import('./pages/student/MyTests'))
const StudentProfile = lazy(() => import('./pages/student/Profile'))

// Basic Pages (lazy)
const BasicCourseDetail = lazy(() => import('./pages/basic/CourseDetail'))
const BatchUpgradeForm = lazy(() => import('./pages/student/BatchUpgradeForm'))

// Admin Pages (lazy)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const ManageCourses = lazy(() => import('./pages/admin/ManageCourses'))
const ManagePdfs = lazy(() => import('./pages/admin/ManagePdfs'))
const ManageVideos = lazy(() => import('./pages/admin/ManageVideos'))
const ManageTestimonials = lazy(() => import('./pages/admin/ManageTestimonials'))
const ManageAchievements = lazy(() => import('./pages/admin/ManageAchievements'))
const ManageStudents = lazy(() => import('./pages/admin/ManageStudents'))
const ManageNotices = lazy(() => import('./pages/admin/ManageNotices'))
const ManageGallery = lazy(() => import('./pages/admin/ManageGallery'))
const ManagePayments = lazy(() => import('./pages/admin/ManagePayments'))
const ManageCounselling = lazy(() => import('./pages/admin/ManageCounselling'))
const ManageOffers = lazy(() => import('./pages/admin/ManageOffers'))
const ManageInquiries = lazy(() => import('./pages/admin/ManageInquiries'))
const ManageMockTests = lazy(() => import('./pages/admin/ManageMockTests'))
const MockResults = lazy(() => import('./pages/admin/MockResults'))
const ManageStudyMaterial = lazy(() => import('./pages/admin/ManageStudyMaterial'))
const ManageDoubts = lazy(() => import('./pages/admin/ManageDoubts'))
const ManageInvoices = lazy(() => import('./pages/admin/ManageInvoices'))
const ManageBatchRequests = lazy(() => import('./pages/admin/ManageBatchRequests'))
const ManageProfileForm = lazy(() => import('./pages/admin/ManageProfileForm'))
const ManageTeachers = lazy(() => import('./pages/admin/ManageTeachers'))
const StudentDetail = lazy(() => import('./pages/admin/StudentDetail'))
const ManageBatches = lazy(() => import('./pages/admin/ManageBatches'))
const AdminHelp = lazy(() => import('./pages/admin/Help'))

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!user) {
    const dest = role === 'admin' ? '/admin-login' : '/student-login'
    return <Navigate to={dest} replace state={{ from: location.pathname + location.search }} />
  }
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Don't auto-scroll in dashboard (admin/student/basic)
    const inDashboard = pathname.startsWith('/admin') || pathname.startsWith('/student') || pathname.startsWith('/basic')
    if (!inDashboard) {
      window.scrollTo(0, 0)
    }
  }, [pathname])
  return null
}

function BasicCourseRedirect() {
  const { id } = useParams()
  return <Navigate to={`/student/basic-courses/${id}`} replace />
}

function MockRunnerRedirect() {
  const { testId } = useParams()
  return <Navigate to={`/student/test-papers/mock/${testId}`} replace />
}

function RouteFallback() {
  return (
    <div className="container-main py-12 w-full animate-pulse">
      <div className="h-8 bg-slate-800 rounded w-1/4 mb-8"></div>
      <GridSkeleton count={6} type="card" />
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [initialLoading, setInitialLoading] = useState(() => !sessionStorage.getItem('rbt_splash_done'))
  const [showAutoLogin, setShowAutoLogin] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!initialLoading) return
    const timer = setTimeout(() => {
      setInitialLoading(false)
      sessionStorage.setItem('rbt_splash_done', '1')
    }, 1500)
    return () => clearTimeout(timer)
  }, [initialLoading])


  // Close login modal if authenticated
  useEffect(() => {
    if (user) {
      setShowAutoLogin(false)
      setShowSignupModal(false)
    }
  }, [user])

  return (
    <>
      <ScrollToTop />

      <AnimatePresence mode="wait">
        {initialLoading ? (
          <LoadingScreen key="splash-screen" />
        ) : (
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {!location.pathname.startsWith('/student') && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/basic') && !location.pathname.startsWith('/student-initialization') && !/^\/(?:student\/|basic\/)?test-papers\/mock\/[^/]+/.test(location.pathname) && (
              <Navbar
                onOpenLogin={() => setShowAutoLogin(true)}
                onOpenSignup={() => setShowSignupModal(true)}
              />
            )}
            <Suspense fallback={<RouteFallback />}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  {/* Public Routes */}
                  <Route path="/" element={<><Home onOpenLogin={() => setShowAutoLogin(true)} /><Footer /></>} />
                  <Route path="/about" element={<><About /><Footer /></>} />
                  <Route path="/apply-teacher" element={<><ApplyTeacher /><Footer /></>} />
                  <Route path="/courses" element={<><Courses /><Footer /></>} />
                  <Route path="/courses/:id" element={<><CourseDetail /><Footer /></>} />
                  <Route path="/videos" element={<Navigate to="/student-login" replace state={{ from: '/student/videos' }} />} />
                  <Route path="/video/:id" element={<><WatchVideo /><Footer /></>} />
                  <Route path="/gallery" element={<><Gallery /><Footer /></>} />
                  <Route path="/achievements" element={<><Achievements /><Footer /></>} />
                  <Route path="/contact" element={<><Contact /><Footer /></>} />
                  <Route path="/counselling" element={<><Counselling /><Footer /></>} />
                  <Route path="/test-papers" element={<><TestPapers /><Footer /></>} />
                  <Route path="/test-papers/downloadable" element={<><TestPapersDownloadable /><Footer /></>} />
                  <Route path="/test-papers/mock" element={<><TestPapersMock /><Footer /></>} />
                  {/* Mock test runner — top-level, no nav/sidebar (NTA-style fullscreen) */}
                  <Route path="/test-papers/mock/:testId" element={<ProtectedRoute role="student"><MockTestRunner /></ProtectedRoute>} />
                  <Route path="/student/test-papers/mock/:testId" element={<ProtectedRoute role="student"><MockTestRunner /></ProtectedRoute>} />
                  <Route path="/basic/test-papers/mock/:testId" element={<MockRunnerRedirect />} />
                  <Route path="/privacy" element={<><PrivacyPolicy /><Footer /></>} />
                  <Route path="/terms" element={<><TermsOfService /><Footer /></>} />
                  <Route path="/student-login" element={<StudentLogin />} />
                  <Route path="/admin-login" element={<AdminLogin />} />

                  {/* Student Routes */}
                  <Route path="/student" element={<ProtectedRoute role="student"><DashboardLayout type="student" /></ProtectedRoute>}>
                    <Route index element={<StudentDashboard />} />
                    <Route path="all-courses" element={<AllCourses />} />
                    <Route path="buy-courses" element={<Navigate to="/student/all-courses" replace />} />
                    <Route path="courses" element={<StudentCourses />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                    <Route path="test-papers" element={<TestPapers />} />
                    <Route path="test-papers/downloadable" element={<TestPapersDownloadable />} />
                    <Route path="test-papers/mock" element={<TestPapersMock />} />
                    <Route path="my-tests" element={<StudentMyTests />} />
                    <Route path="pdfs" element={<StudentPdfs />} />
                    <Route path="study-material" element={<StudyMaterial />} />
                    <Route path="videos" element={<StudentVideos />} />
                    <Route path="notices" element={<StudentNotices />} />
                    <Route path="achievements" element={<StudentAchievements />} />
                    <Route path="counselling" element={<StudentCounselling />} />
                    <Route path="payment" element={<Payment />} />
                    <Route path="invoices" element={<Invoices />} />
                    <Route path="doubts" element={<StudentDoubts />} />
                    <Route path="mock-results" element={<StudentMockResults />} />
                    <Route path="profile" element={<StudentProfile />} />
                    <Route path="basic-courses" element={<Navigate to="/student/all-courses" replace />} />
                    <Route path="basic-courses/:id" element={<BasicCourseDetail />} />
                    <Route path="upgrade-batch" element={<BatchUpgradeForm />} />
                    <Route path="offline-enrollment" element={<BatchUpgradeForm />} />
                  </Route>

                  {/* Legacy redirects */}
                  <Route path="/student-initialization" element={<Navigate to="/student" replace />} />
                  <Route path="/basic" element={<Navigate to="/student" replace />} />
                  <Route path="/basic/courses" element={<Navigate to="/student/all-courses" replace />} />
                  <Route path="/basic/courses/:id" element={<BasicCourseRedirect />} />
                  <Route path="/basic/videos" element={<Navigate to="/student/videos" replace />} />
                  <Route path="/basic/test-papers" element={<Navigate to="/student/test-papers" replace />} />
                  <Route path="/basic/test-papers/downloadable" element={<Navigate to="/student/test-papers/downloadable" replace />} />
                  <Route path="/basic/test-papers/mock" element={<Navigate to="/student/test-papers/mock" replace />} />
                  <Route path="/basic/payment" element={<Navigate to="/student/payment" replace />} />
                  <Route path="/basic/upgrade-batch" element={<Navigate to="/student/upgrade-batch" replace />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout type="admin" /></ProtectedRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="courses" element={<ManageCourses />} />
                    <Route path="test-papers" element={<ManagePdfs />} />
                    <Route path="pdfs" element={<ManagePdfs />} />
                    <Route path="mock-tests" element={<ManageMockTests />} />
                    <Route path="mock-results" element={<MockResults />} />
                    <Route path="study-material" element={<ManageStudyMaterial />} />
                    <Route path="videos" element={<ManageVideos />} />
                    <Route path="testimonials" element={<ManageTestimonials />} />
                    <Route path="achievements" element={<ManageAchievements />} />
                    <Route path="students" element={<ManageStudents />} />
                    <Route path="students/:studentId" element={<StudentDetail />} />
                    <Route path="batch-students" element={<Navigate to="/admin/students" replace />} />
                    <Route path="batch-requests" element={<ManageBatchRequests />} />
                    <Route path="offline-enrollments" element={<ManageBatchRequests />} />
                    <Route path="batches" element={<ManageBatches />} />
                    <Route path="notices" element={<ManageNotices />} />
                    <Route path="gallery" element={<ManageGallery />} />
                    <Route path="payments" element={<ManagePayments />} />
                    <Route path="counselling" element={<ManageCounselling />} />
                    <Route path="offers" element={<ManageOffers />} />
                    <Route path="inquiries" element={<ManageInquiries />} />
                    <Route path="doubts" element={<ManageDoubts />} />
                    <Route path="invoices" element={<ManageInvoices />} />
                    <Route path="profile-form" element={<ManageProfileForm />} />
                    <Route path="teachers" element={<ManageTeachers />} />
                    <Route path="help" element={<AdminHelp />} />
                  </Route>

                  {/* Catch-all 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </Suspense>

            <AnimatePresence>
              {showAutoLogin && (
                <Suspense fallback={null}>
                  <StudentLogin 
                    isPopup={true} 
                    onClose={() => setShowAutoLogin(false)} 
                    onSwitchToSignup={() => {
                      setShowAutoLogin(false);
                      setShowSignupModal(true);
                    }}
                  />
                </Suspense>
              )}
              {showSignupModal && (
                <Suspense fallback={null}>
                  <StudentSignup 
                    isPopup={true} 
                    onClose={() => setShowSignupModal(false)} 
                    onSwitchToLogin={() => {
                      setShowSignupModal(false);
                      setShowAutoLogin(true);
                    }}
                  />
                </Suspense>
              )}
            </AnimatePresence>

            {/* Offer popup - shows on public pages only */}
            {!initialLoading && !location.pathname.startsWith('/student') && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/basic') && !location.pathname.startsWith('/student-initialization') && !location.pathname.includes('login') && (
              <OfferPopup />
            )}
            {/* Profile popup for active batch students who haven't filled profile */}
            {!initialLoading && user && user.role === 'student' && !user.profileCompleted && (
              <ProfilePopup />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
