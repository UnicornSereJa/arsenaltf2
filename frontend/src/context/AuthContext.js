import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/users/me/')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/token/', { login, password });
    const { access } = response.data;
    localStorage.setItem('access_token', access);
    const userResponse = await api.get('/users/me/');
    setUser(userResponse.data);
    return userResponse.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const register = async (login, email, password) => {
    const response = await api.post('/users/', { login, email, password });
    return response.data;
  };

  const value = { user, loading, login, logout, register };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};