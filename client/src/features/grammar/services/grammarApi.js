import { apiClient } from "../../../services/apiClient.js";

export function getGrammarLessons(params) {
  return apiClient.get("/grammar", { params });
}
