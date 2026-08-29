import axios from 'axios';

// 1. Create Axios Instance with base configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


// 2. Request Interceptor: Attach JWT Bearer Token dynamically
API.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('campusos_user');
    if (storedUser) {
      try {
        const { token } = JSON.parse(storedUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing campusos_user token from localStorage:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Safe 401 Session Cleanup
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCheck = error.config?.url?.includes('/auth/login');

    if (error.response && error.response.status === 401 && !isAuthCheck) {
      // Clear invalid session
      localStorage.removeItem('campusos_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// -----------------------------------------------------------------------------
// 📦 API Endpoint Collections
// -----------------------------------------------------------------------------

// Authentication Endpoints
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const registerUser = (userData) => API.post('/auth/register', userData);
export const getProfile = () => API.get('/auth/profile');

// Dashboard Endpoints
export const getStudentDashboardData = () => API.get('/dashboard/student');
export const getFacultyDashboardData = () => API.get('/dashboard/faculty');
export const getAdminDashboardData = () => API.get('/dashboard/admin');

// Course Endpoints
export const getCourses = (params = {}) => API.get('/courses', { params });
export const getCourseDetails = (courseId) => API.get(`/courses/${courseId}`);
export const createCourse = (data) => API.post('/courses', data);
export const updateCourse = (courseId, data) => API.put(`/courses/${courseId}`, data);
export const deleteCourse = (courseId) => API.delete(`/courses/${courseId}`);
export const enrollInCourse = (courseId) => API.post(`/courses/${courseId}/enroll`);
export const dropCourse = (courseId) => API.delete(`/courses/${courseId}/drop`);

// Course Material Endpoints
export const getCourseMaterials = (courseId) => API.get(`/courses/${courseId}/materials`);
export const addCourseMaterial = (courseId, materialData) => API.post(`/courses/${courseId}/materials`, materialData);
export const deleteCourseMaterial = (courseId, materialId) => API.delete(`/courses/${courseId}/materials/${materialId}`);

// Assignment Endpoints
export const createAssignment = (data) => API.post('/assignments', data);
export const getCourseAssignments = (courseId) => API.get(`/assignments/course/${courseId}`);
export const submitAssignment = (id, data) => API.post(`/assignments/${id}/submit`, data);

// Helpdesk & Support Ticket Endpoints
export const getTickets = () => API.get('/tickets');
export const getTicketDetails = (id) => API.get(`/tickets/${id}`);
export const createTicket = (ticketData) => API.post('/tickets', ticketData);
export const updateTicket = (id, ticketData) => API.put(`/tickets/${id}`, ticketData);
export const addTicketComment = (id, text) => API.post(`/tickets/${id}/comments`, { text });
export const assignTicket = (id, assignedTo) => API.patch(`/tickets/${id}/assign`, { assignedTo });

// User Management Endpoints
export const getFacultyList = () => API.get('/users?role=faculty');

export default API;