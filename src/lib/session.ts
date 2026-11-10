export const SESSION_MARKER = "cookie-session";

export type StoredSessionUser = {
  role?: string;
  google_onboarding_required_at?: string | null;
  [key: string]: unknown;
};

export function requiresGoogleOnboarding(user?: { role?: string; google_onboarding_required_at?: string | null } | null) {
  return user?.role === "student" && Boolean(user.google_onboarding_required_at);
}

export function storeBrowserSession(user: StoredSessionUser) {
  localStorage.setItem("token", SESSION_MARKER);
  localStorage.setItem("user", JSON.stringify(user));
}

export function usesCookieSession() {
  return localStorage.getItem("token") === SESSION_MARKER;
}
