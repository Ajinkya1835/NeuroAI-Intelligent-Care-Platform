import type { Overview, Module, ModuleProgress, Insights, Submission, SubmitResult } from './types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const today = () => new Date().toLocaleDateString('en-CA');
const q = (values: Record<string, string | undefined>) => Object.entries(values).filter(([, value]) => value).map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`).join('&');

async function call(path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${path}`);
  return data;
}

export type Ids = { childId: string; parentId: string };
export const teachingApi = {
  overview: ({ childId, parentId }: Ids): Promise<Overview> => call(`/api/teaching/overview?${q({ childId, parentId, day: today() })}`),
  module: (slug: string, { childId, parentId }: Ids): Promise<{ module: Module; progress: ModuleProgress }> => call(`/api/teaching/modules/${slug}?${q({ childId, parentId })}`),
  insights: ({ childId, parentId }: Ids): Promise<Insights> => call(`/api/teaching/children/${childId}/insights?${q({ parentId })}`),
  history: ({ childId, parentId }: Ids, moduleSlug: string, worksheetId: string): Promise<Submission[]> => call(`/api/teaching/children/${childId}/submissions?${q({ parentId, moduleSlug, worksheetId })}`),
  submit: (form: FormData): Promise<SubmitResult> => { form.append('day', today()); return call('/api/teaching/submissions', { method: 'POST', body: form }); },
  remove: (id: string, parentId: string): Promise<{ ok: boolean }> => call(`/api/teaching/submissions/${id}?${q({ parentId })}`, { method: 'DELETE' }),
  pdfUrl: (slug: string, worksheetId: string, ids: Ids, inline = false) => `${API}/api/teaching/worksheets/${slug}/${worksheetId}/pdf?${q({ ...ids, inline: inline ? '1' : undefined })}`,
  fileUrl: (submissionId: string, parentId: string) => `${API}/api/teaching/submissions/${submissionId}/file?${q({ parentId })}`,
};
