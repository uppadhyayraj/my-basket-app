// User session management
// Reads the authenticated user's ID from localStorage (set by AuthContext)

const AUTH_USER_KEY = 'mybasket_auth_user';

export function getUserId(): string {
  if (typeof window === 'undefined') return ''; // SSR fallback - no user

  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.id) return user.id;
    }
  } catch {
    // ignore parse errors
  }

  return ''; // Not logged in
}

export function isLoggedIn(): boolean {
  return getUserId() !== '';
}
