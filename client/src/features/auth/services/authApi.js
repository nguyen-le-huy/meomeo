import { apiClient } from "../../../services/apiClient.js";

export function loginApi(payload) {
  return apiClient.post("/auth/login", payload);
}

export function getMeApi() {
  return apiClient.get("/auth/me");
}
