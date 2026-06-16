import { apiClient } from "../../../services/apiClient.js";

export function assessPronunciation(payload) {
  return apiClient.post("/speech/pronunciation-assessment", payload);
}
