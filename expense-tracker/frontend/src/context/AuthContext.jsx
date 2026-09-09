import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import ColdStartLoader from '../components/ColdStartLoader';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  // Cold Start Detection
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [coldStartFailed, setColdStartFailed] = useState(false);
  const hasCheckedServerRef = useRef(false);

  useEffect(() => {
    if (!hasCheckedServerRef.current) {
      checkServerHealth();
    }
  }, []);

  const checkServerHealth = async () => {
    hasCheckedServerRef.current = true;
    setColdStartFailed(false);

    // Show cold start loader if request takes > 1.2s
    const timer = setTimeout(() => {
      setIsColdStarting(true);
    }, 1200);

    try {
      if (token) {
        await api.get('/notifications');
      } else {
        // Ping unauthenticated path
        await api.get('/income/2026/9');
      }
      clearTimeout(timer);
      setIsColdStarting(false);
    } catch (err) {
      clearTimeout(timer);
      // If error is 401 or response arrived, server is awake
      if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
        setIsColdStarting(false);
      } else {
        setIsColdStarting(true);
        setColdStartFailed(true);
      }
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.success && res.data) {
        const { token, userId, username } = res.data;
        const userData = { id: userId, username };
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(token);
        setUser(userData);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password, confirmPassword) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { username, password, confirmPassword });
      if (res.success) {
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (ignored) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, loading }}>
      {isColdStarting && (
        <ColdStartLoader isFailed={coldStartFailed} onRetry={checkServerHealth} />
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
