import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hrnova_token') || null);
  const [loading, setLoading] = useState(true);

  // Auto-login demo user on startup if not logged in
  useEffect(() => {
    async function initAuth() {
      const savedUser = localStorage.getItem('hrnova_user');
      const savedToken = localStorage.getItem('hrnova_token');

      if (savedUser && savedToken) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch (e) {
          console.error('Failed to parse saved user:', e);
        }
      } else {
        // Default to Admin Sarah Jenkins so the app opens with rich full functionality
        await switchRole('admin');
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (username, password) => {
    const data = await API.login(username, password);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('hrnova_user', JSON.stringify(data.user));
    localStorage.setItem('hrnova_token', data.token);
    return data.user;
  };

  // Quick switch role between 'admin' and 'employee' for rapid evaluation
  const switchRole = async (targetRole) => {
    const username = targetRole === 'admin' ? 'admin' : 'alex';
    const password = targetRole === 'admin' ? 'admin123' : 'employee123';
    return await login(username, password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hrnova_user');
    localStorage.removeItem('hrnova_token');
  };

  const authHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, switchRole, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
