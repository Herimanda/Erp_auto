import axios from 'axios';
import { storage } from '../utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  const token = await storage.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.remove('token');
      await storage.remove('user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || 'Une erreur est survenue.';
    return Promise.reject(new Error(message));
  }
);

export default api;