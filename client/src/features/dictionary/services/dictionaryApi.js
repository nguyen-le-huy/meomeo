import { apiClient } from "../../../services/apiClient.js";

export function lookupDictionary(data) {
  return apiClient.post("/dictionary/lookup", data);
}
