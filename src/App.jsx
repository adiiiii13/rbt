import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import OfferPopup from './components/OfferPopup'

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

// Student Pages (lazy)
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const StudentCourses = lazy(() => import('./pages/student/Courses'))
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

// Basic Pages (lazy)
const BasicDashboard = lazy(() => import('./pages/basic/Dashboard'))

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
const ManageNotifications = lazy(() => import('./pages/admin/ManageNotifications'))
const ManageInvoices = lazy(() => import('./pages/admin/ManageInvoices'))
const AdminHelp = lazy(() => import('./pages/admin/Help'))

function ProtectedRoute({ children, role, batch }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!user) {
    const dest = role === 'admin' ? '/admin-login' : '/student-login'
    return <Navigate to={dest} replace state={{ from: location.pathname + location.search }} />
  }
  if (role && user.role !== role) return <Navigate to="/" replace />
  // Batch dashboard requires batch: true
  if (batch && !user.batch) return <Navigate to="/basic" replace />
  return children
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
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

  // Auto-show login modal only if not authenticated and on public route
  useEffect(() => {
    if (initialLoading || authLoading) return
    const path = window.location.pathname
    const onAuthRoute = path.includes('login') || path.startsWith('/student') || path.startsWith('/admin') || path.startsWith('/basic')
    if (!user && !onAuthRoute) setShowAutoLogin(true)
    else if (user) setShowAutoLogin(false)
  }, [initialLoading, authLoading, user])

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
            <Navbar 
              onOpenLogin={() => setShowAutoLogin(true)} 
              onOpenSignup={() => setShowSignupModal(true)} 
            />
            <Suspense fallback={<RouteFallback />}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  {/* Public Routes */}
                  <Route path="/" element={<><Home onOpenLogin={() => setShowAutoLogin(true)} /><Footer /></>} />
                  <Route path="/about" element={<><About /><Footer /></>} />
                  <Route path="/courses" element={<><Courses /><Footer /></>} />
                  <Route path="/courses/:id" element={<><CourseDetail /><Footer /></>} />
                  <Route path="/videos" element={<><Videos /><Footer /></>} />
                  <Route path="/video/:id" element={<><WatchVideo /><Footer /></>} />
                  <Route path="/gallery" element={<><Gallery /><Footer /></>} />
                  <Route path="/achievements" element={<><Achievements /><Footer /></>} />
                  <Route path="/contact" element={<><Contact /><Footer /></>} />
                  <Route path="/counselling" element={<><Counselling /><Footer /></>} />
                  <Route path="/test-papers" element={<><TestPapers /><Footer /></>} />
                  <Route path="/test-papers/downloadable" element={<><TestPapersDownloadable /><Footer /></>} />
                  <Route path="/test-papers/mock" element={<><TestPapersMock /><Footer /></>} />
                  <Route path="/test-papers/mock/:testId" element={<MockTestRunner />} />
                  <Route path="/privacy" element={<><PrivacyPolicy /><Footer /></>} />
                  <Route path="/terms" element={<><TermsOfService /><Footer /></>} />
                  <Route path="/student-login" element={<StudentLogin />} />
                  <Route path="/admin-login" element={<AdminLogin />} />

                  {/* Student Routes (Batch — full access) */}
                  <Route path="/student" element={<ProtectedRoute role="student" batch><DashboardLayout type="student" /></ProtectedRoute>}>
                    <Route index element={<StudentDashboard />} />
                    <Route path="courses" element={<StudentCourses />} />
                    <Route path="courses/:id" element={<CourseDetail />} />
                    <Route path="test-papers" element={<TestPapers />} />
                    <Route path="test-papers/downloadable" element={<TestPapersDownloadable />} />
                    <Route path="test-papers/mock" element={<TestPapersMock />} />
                    <Route path="test-papers/mock/:testId" element={<MockTestRunner />} />
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
                  </Route>

                  {/* Basic Routes (limited access) */}
                  <Route path="/basic" element={<ProtectedRoute role="student"><DashboardLayout type="basic" /></ProtectedRoute>}>
                    <Route index element={<BasicDashboard />} />
                    <Route path="courses" element={<StudentCourses />} />
                    <Route path="videos" element={<StudentVideos />} />
                    <Route path="test-papers" element={<TestPapers />} />
                    <Route path="test-papers/downloadable" element={<TestPapersDownloadable />} />
                    <Route path="test-papers/mock" element={<TestPapersMock />} />
                    <Route path="test-papers/mock/:testId" element={<MockTestRunner />} />
                    <Route path="payment" element={<Payment />} />
                  </Route>

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
                    <Route path="notices" element={<ManageNotices />} />
                    <Route path="gallery" element={<ManageGallery />} />
                    <Route path="payments" element={<ManagePayments />} />
                    <Route path="counselling" element={<ManageCounselling />} />
                    <Route path="offers" element={<ManageOffers />} />
                    <Route path="inquiries" element={<ManageInquiries />} />
                    <Route path="doubts" element={<ManageDoubts />} />
                    <Route path="notifications" element={<ManageNotifications />} />
                    <Route path="invoices" element={<ManageInvoices />} />
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
            {!initialLoading && !location.pathname.startsWith('/student') && !location.pathname.startsWith('/admin') && !location.pathname.includes('login') && (
              <OfferPopup />
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
