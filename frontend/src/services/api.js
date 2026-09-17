import axios from 'axios';

/**
 * 1. Base URL Normalization
 * Ensures the API base URL always targets the Express `/api` prefix cleanly.
 */
const rawBaseURL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://campusos-college-erp.onrender.com';

// Strip any trailing slash and ensure it ends with `/api`
const sanitizedBaseURL = rawBaseURL.replace(/\/+$/, '').endsWith('/api')
  ? rawBaseURL.replace(/\/+$/, '')
  : `${rawBaseURL.replace(/\/+$/, '')}/api`;

const API = axios.create({
  baseURL: sanitizedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 2. Request Interceptor
 * Automatically injects the JWT Bearer Token into request headers.
 */
API.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('campusos_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Extract token from either parsed user object or direct string wrapper
        const token = parsed?.token || parsed;
        if (token && typeof token === 'string') {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to parse auth token from localStorage:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 3. Response Interceptor
 * Handles safe 401 unauthenticated session cleanup without infinite loops.
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest =
      requestUrl.includes('/users/login') ||
      requestUrl.includes('/auth/login');

    // Redirect on expired/invalid tokens for protected route calls
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('campusos_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// 📦 API Endpoint Modules
// =============================================================================

// --- Authentication Endpoints ---
// Note: Adjust '/users/login' vs '/auth/login' to match your Express mount path
export const loginUser = (credentials) => API.post('/users/login', credentials);
export const registerUser = (userData) => API.post('/users/register', userData);
export const getProfile = () => API.get('/users/profile');

// --- Dashboard & Analytics Endpoints ---
export const getStudentDashboardData = () => API.get('/dashboard/student');
export const getFacultyDashboardData = () => API.get('/dashboard/faculty');
export const getAdminDashboardData = () => API.get('/dashboard/admin');
export const getStudentDashboardStats = (options = {}) => API.get('/analytics/student', options);
export const getFacultyDashboardStats = (options = {}) => API.get('/analytics/faculty', options);

// --- Admin Management Endpoints ---
export const getFacultyList = () => API.get('/admin/users', { params: { role: 'faculty' } });
export const getStudentList = () => API.get('/admin/users', { params: { role: 'student' } });
export const createUserAccount = (userData) => API.post('/admin/users', userData);
export const enrollStudentInCourse = (enrollData) => API.post('/admin/enroll', enrollData);

// --- Course Endpoints ---
export const getCourses = (params = {}) => API.get('/courses', { params });
export const getCourseDetails = (courseId) => API.get(`/courses/${courseId}`);
export const createCourse = (data) => API.post('/courses', data);
export const updateCourse = (courseId, data) => API.put(`/courses/${courseId}`, data);
export const deleteCourse = (courseId) => API.delete(`/courses/${courseId}`);
export const enrollInCourse = (courseId) => API.post(`/courses/${courseId}/enroll`);
export const dropCourse = (courseId) => API.delete(`/courses/${courseId}/drop`);

// --- Course Materials ---
export const getCourseMaterials = (courseId) => API.get(`/courses/${courseId}/materials`);
export const addCourseMaterial = (courseId, data) => API.post(`/courses/${courseId}/materials`, data);
export const deleteCourseMaterial = (courseId, materialId) => API.delete(`/courses/${courseId}/materials/${materialId}`);

// --- Assignments ---
export const createAssignment = (data) => API.post('/assignments', data);
export const getCourseAssignments = (courseId) => API.get(`/assignments/course/${courseId}`);
export const submitAssignment = (id, data) => API.post(`/assignments/${id}/submit`, data);
export const getAssignmentSubmissions = (id) => API.get(`/assignments/${id}/submissions`);
export const gradeSubmission = (submissionId, data) => API.put(`/assignments/submissions/${submissionId}/grade`, data);

// --- Helpdesk & Tickets ---
export const getTickets = () => API.get('/tickets');
export const getTicketDetails = (id) => API.get(`/tickets/${id}`);
export const createTicket = (ticketData) => API.post('/tickets', ticketData);
export const updateTicket = (id, ticketData) => API.put(`/tickets/${id}`, ticketData);
export const addTicketComment = (id, text) => API.post(`/tickets/${id}/comments`, { text });
export const assignTicket = (id, assignedTo) => API.patch(`/tickets/${id}/assign`, { assignedTo });

// --- Attendance Endpoints ---
export const getStudentAttendance = () => API.get('/attendance/student');
export const markAttendance = (data) => API.post('/attendance', data);
export const getEnrolledStudentsForCourse = (courseId) => API.get(`/courses/${courseId}/students`);
export const getCourseAttendance = (courseId, date, options = {}) =>
  API.get(`/attendance/course/${courseId}?date=${date}`, options);

export default API;