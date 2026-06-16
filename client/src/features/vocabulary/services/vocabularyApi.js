import { apiClient } from "../../../services/apiClient.js";

export function getVocabularyItems(params) {
  return apiClient.get("/vocabulary", { params });
}
