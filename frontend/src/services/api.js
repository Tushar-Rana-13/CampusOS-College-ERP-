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

// 3. Response Interceptor: Handle Global 401 Unauthorized (Expired / Tampered Token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
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

// User Management Endpoints
export const getFacultyList = () => API.get('/users?role=faculty');

export default API;