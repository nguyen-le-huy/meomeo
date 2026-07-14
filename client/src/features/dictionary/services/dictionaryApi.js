import { apiClient } from "../../../services/apiClient.js";

export function lookupDictionary(data) {
  return apiClient.post("/dictionary/lookup", data);
}

export function getDictionaryHistory(params) {
  return apiClient.get("/dictionary/history", { params });
}

export function removeDictionaryHistory(id, sessionId) {
  return apiClient.delete(`/dictionary/history/${id}`, { params: { sessionId } });
}

export function clearDictionaryHistory(sessionId) {
  return apiClient.delete("/dictionary/history", { params: { sessionId } });
}
