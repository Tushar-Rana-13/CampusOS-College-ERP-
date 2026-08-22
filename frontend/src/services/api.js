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

// 3. Response Interceptor: Handle Global Network/Server Errors & 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error response exists before inspecting HTTP status code
    if (error.response && error.response.status === 401) {
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

// Dashboard Endpoints
export const getStudentDashboardData = () => API.get('/dashboard/student');
export const getFacultyDashboardData = () => API.get('/dashboard/faculty');
export const getAdminDashboardData = () => API.get('/dashboard/admin');

// Helpdesk & Support Ticket Endpoints
export const getTickets = () => API.get('/tickets');
export const getTicketDetails = (id) => API.get(`/tickets/${id}`);
export const createTicket = (ticketData) => API.post('/tickets', ticketData);
export const updateTicket = (id, ticketData) => API.put(`/tickets/${id}`, ticketData);
export const addTicketComment = (id, text) => API.post(`/tickets/${id}/comments`, { text });
export const assignTicket = (id, assignedTo) => API.patch(`/tickets/${id}/assign`, { assignedTo });

// Course Endpoints
export const getCourses = () => API.get('/courses');
export const createCourse = (data) => API.post('/courses', data);
export const enrollCourse = (courseId, data = {}) => API.post(`/courses/${courseId}/enroll`, data);

// Assignment Endpoints
export const createAssignment = (data) => API.post('/assignments', data);
export const getCourseAssignments = (courseId) => API.get(`/assignments/course/${courseId}`);
export const submitAssignment = (id, data) => API.post(`/assignments/${id}/submit`, data);

// User Management Endpoints
export const getFacultyList = () => API.get('/users?role=faculty');

export default API;