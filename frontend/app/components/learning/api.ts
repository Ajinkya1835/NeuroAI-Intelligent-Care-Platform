import type { Overview, Module, ModuleProgress, SubmitResult } from './types';
import { authFetch } from '../../lib/auth';

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the parent's local time

async function call(path: string, init?: RequestInit) {
  const res = await authFetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${path}`);
  return data;
}

export const learningApi = {
  overview: (parentId: string): Promise<Overview> =>
    call(`/api/learning/overview?parentId=${parentId}&day=${today()}`),
  module: (slug: string, parentId: string): Promise<{ module: Module; progress: ModuleProgress }> =>
    call(`/api/learning/modules/${slug}?parentId=${parentId}`),
  submit: (slug: string, body: { parentId: string; scope: 'lesson' | 'quiz'; targetId: string; answers: Record<string, number> }): Promise<SubmitResult> =>
    call(`/api/learning/modules/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, day: today() }),
    }),
};