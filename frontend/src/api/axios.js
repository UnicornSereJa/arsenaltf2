import axios from 'axios';

// Определяем базовый URL в зависимости от окружения
const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://arsenaltf2.relaxdev.ru/api'
  : 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;