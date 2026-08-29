// client/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Security Components
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyCourses from './pages/FacultyCourses'; // <-- IMPORT FACULTY COURSES
import AdminDashboard from './pages/AdminDashboard';
import StudentHelpdesk from './pages/StudentHelpdesk';
import AdminHelpdesk from './pages/AdminHelpdesk';
import CoursesPage from './pages/CoursesPage';
import MyCourses from './pages/MyCourses';
import CourseDetailsPage from './pages/CourseDetailsPage';
import CourseCatalog from './pages/CourseCatalog';
import { useAuth } from './context/AuthContext';

function CourseRoute() {
  const { user } = useAuth();
  return user?.role === 'student' ? <MyCourses /> : <CoursesPage user={user} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* Shared Course Routes */}
              <Route path="/courses" element={<CourseRoute />} />
              <Route path="/courses/catalog" element={<CourseCatalog />} />
              <Route path="/courses/:courseId" element={<CourseDetailsPage />} />

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/helpdesk" element={<StudentHelpdesk />} />
              </Route>

              {/* Faculty Routes */}
              <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/courses" element={<FacultyCourses />} /> {/* <-- ADDED ROUTE HERE */}
                <Route path="/faculty/helpdesk" element={<AdminHelpdesk />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/helpdesk" element={<AdminHelpdesk />} />
              </Route>

            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}