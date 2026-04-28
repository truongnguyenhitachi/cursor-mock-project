import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { DashboardPage } from './pages/Dashboard'
import { StudentsPage } from './pages/Students'
import { CoursesPage } from './pages/Courses'
import { CourseDetailPage } from './pages/CourseDetail'
import { AttendancePage } from './pages/Attendance'
import { AuthPage } from './pages/Auth'
import { MyCoursesPage } from './pages/MyCourses'
import { NotesPage } from './pages/Notes'
import './styles/app.css'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:id" element={<CourseDetailPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route
                path="my-courses"
                element={
                  <RequireAuth>
                    <MyCoursesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="notes"
                element={
                  <RequireAuth>
                    <NotesPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}
