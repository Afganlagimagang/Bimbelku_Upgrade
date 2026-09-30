export const SESSION_MARKER = "cookie-session";

export type StoredSessionUser = {
  role?: string;
  [key: string]: unknown;
};

export function storeBrowserSession(user: StoredSessionUser) {
  localStorage.setItem("token", SESSION_MARKER);
  localStorage.setItem("user", JSON.stringify(user));
}

export function usesCookieSession() {
  return localStorage.getItem("token") === SESSION_MARKER;
}
