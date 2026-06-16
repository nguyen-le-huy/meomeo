import { apiClient } from "../../../services/apiClient.js";

export function login(payload) {
  return apiClient.post("/auth/login", payload);
}
