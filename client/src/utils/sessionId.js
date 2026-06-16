const SESSION_KEY = "meomeo_guest_session_id";

export function getGuestSessionId() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const value = crypto.randomUUID ? crypto.randomUUID() : `guest-${Date.now()}`;
  localStorage.setItem(SESSION_KEY, value);
  return value;
}
