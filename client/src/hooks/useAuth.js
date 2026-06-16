import { useAuthStore } from "../features/auth/stores/authStore.js";

export function useAuth() {
  return useAuthStore();
}
