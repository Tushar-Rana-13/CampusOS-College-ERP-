import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

// Create Auth Context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage on application load
  useEffect(() => {
    const initializeAuth = () => {
      const storedData = localStorage.getItem('campusos_user');
      if (storedData) {
        try {
          const parsedUser = JSON.parse(storedData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse user session:', error);
          localStorage.removeItem('campusos_user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Login Action
   * Sends request to POST /api/auth/login
   * Saves response (user details + JWT) to state & localStorage
   */
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      setUser(data);
      localStorage.setItem('campusos_user', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, error: message };
    }
  };

  /**
   * Logout Action
   * Clears state and removes local storage session
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('campusos_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom Hook for accessing Auth Context cleanly
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};