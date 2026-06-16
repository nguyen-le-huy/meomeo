import { apiClient } from "../../../services/apiClient.js";

export function getExercises(params) {
  return apiClient.get("/exercises", { params });
}
