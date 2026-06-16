import { create } from "zustand";

const AUTH_STORAGE_KEY = "meomeo_auth";

function getStoredAuth() {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function saveStoredAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function removeStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

const storedAuth = getStoredAuth();

export const useAuthStore = create((set) => ({
  user: storedAuth?.user || null,
  token: storedAuth?.token || null,
  isAuthenticated: Boolean(storedAuth?.token),
  setAuth: ({ user, token }) => {
    saveStoredAuth({ user, token });
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    removeStoredAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },
  clearAuth: () => {
    removeStoredAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export { AUTH_STORAGE_KEY };
