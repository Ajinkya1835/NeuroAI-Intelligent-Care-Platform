import { authFetch } from '../../lib/auth';

export async function call(path: string, init?: RequestInit) {
  const res = await authFetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}
export const send = (path: string, body: any, method = 'POST') =>
  call(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const del = (path: string) => call(path, { method: 'DELETE' });
export const today = () => new Date().toISOString().slice(0, 10);
export const shortDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'short' }).slice(0, 2);
