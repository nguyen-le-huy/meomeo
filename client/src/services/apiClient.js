import axios from "axios";
import { AUTH_STORAGE_KEY } from "../features/auth/stores/authStore.js";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5050/api",
});

apiClient.interceptors.request.use((config) => {
  const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);

  if (rawAuth) {
    try {
      const auth = JSON.parse(rawAuth);

      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    return Promise.reject(error);
  },
);
