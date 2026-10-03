// Session handling shared by every API call in the app.
// The token is a JWT issued by POST /api/auth/login and stored in localStorage.
export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type Role = 'parent' | 'therapist';
export type SessionUser = { id: string; name: string; email: string; role: Role };
type Session = { token: string; user: SessionUser };

const KEY = 'neuroai.session';

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch { return null; }
}
export const getToken = () => getSession()?.token || '';
export function saveSession(s: Session) { window.localStorage.setItem(KEY, JSON.stringify(s)); }
export function clearSession() { try { window.localStorage.removeItem(KEY); } catch {} }

export function logout() {
  clearSession();
  window.location.replace('/login');
}

// fetch() against the backend with the Authorization header attached.
// A 401 means the session is gone or expired, so send the user back to the login page.
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth/login')) {
    clearSession();
    if (!window.location.pathname.startsWith('/login')) window.location.replace('/login');
  }
  return res;
}

// For links the browser opens itself (PDF download / uploaded sheet), which cannot send headers.
export const withToken = (url: string) => `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(getToken())}`;

export async function login(email: string, password: string, role: Role) {
  const res = await authFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not log in. Is the backend running?');
  saveSession({ token: data.token, user: data.user });
  return data.user as SessionUser;
}
