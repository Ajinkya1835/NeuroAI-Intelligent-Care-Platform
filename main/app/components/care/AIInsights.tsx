'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check, TrendingDown, TrendingUp, Minus, ThumbsUp, AlertTriangle, Clock3, MessageCircleQuestion, Stethoscope, Printer } from 'lucide-react';
import { Card, btnGhost } from '../learning/ui';
import { call, send } from './api';

const tone: Record<string, string> = { good: 'text-emerald-700', watch: 'text-rose-700', neutral: 'text-slate-500' };
const pri: Record<string, string> = { high: 'bg-rose-100 text-rose-800', medium: 'bg-amber-100 text-amber-800', low: 'bg-emerald-100 text-emerald-800' };
const dq: Record<string, string> = { low: 'bg-amber-100 text-amber-800', ok: 'bg-slate-100 text-slate-700', good: 'bg-emerald-100 text-emerald-800' };
const WHENS = ['This week', 'Next 2 weeks', 'Ongoing'];

export default function AIInsights({ childId, name, role }: { childId: string; name: string; role: 'parent' | 'therapist' }) {
  const [rep, setRep] = useState<any>(null);
  const [ai, setAi] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const version = useRef('');
  const key = `neuroai.actions.${childId}`;

  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(key) || '{}')); } catch { setDone({}); } }, [key]);
  const toggle = (t: string) => setDone((d) => { const n = { ...d, [t]: !d[t] }; try { localStorage.setItem(key, JSON.stringify(n)); } catch {} return n; });

  const writeAi = useCallback(async (refresh = false) => {
    setBusy(true);
    try { setAi(await send(`/api/children/${childId}/insights/ai`, { refresh })); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }, [childId]);

  const loadReport = useCallback(async (silent = false) => {
    try {
      const r = await call(`/api/children/${childId}/insights/report`);
      setErr('');
      if (r.dataVersion !== version.current) { version.current = r.dataVersion; setRep(r); if (!silent || ai) writeAi(false); }
    } catch (e: any) { if (!silent) setErr(e.message); }
  }, [childId, writeAi]); // eslint-disable-line

  useEffect(() => { version.current = ''; setRep(null); setAi(null); loadReport(); const t = setInterval(() => loadReport(true), 45000); return () => clearInterval(t); }, [loadReport]);

  if (err && !rep) return <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">Could not load insights ({err}). <button className="underline font-medium" onClick={() => loadReport()}>Retry</button></Card>;
  if (!rep) return <p className="text-sm text-slate-500">Reading {name}&apos;s data…</p>;

  const summary = ai?.summary || rep.summary;
  const actions = (ai?.actions?.length ? ai.actions : rep.actions) as any[];
  const questions = (ai?.questions?.length ? ai.questions : rep.questions) as string[];
  const label = ai ? (ai.source === 'ollama' ? 'Written by AI from the logged data' : 'Written from the logged data') : 'Writing summary…';

  const text = () => [
    `${name}: ${rep.headline}`, '', summary, '',
    'This week vs last week:', ...rep.changed.map((c: any) => `- ${c.title}: ${c.now}${c.before ? ` (was ${c.before})` : ''}`), '',
    rep.risk.length ? 'Watch for:' : '', ...rep.risk.map((r: any) => `- ${r.label}: ${r.detail}`), '',
    'Actions:', ...actions.map((a) => `- [${a.when}] ${a.title}: ${a.how}`), '',
    questions.length ? (role === 'parent' ? 'Questions for the therapist:' : 'Talking points:') : '', ...questions.map((q) => `- ${q}`),
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
  const copy = async () => { try { await navigator.clipboard.writeText(text()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };

  return (
    <div className="space-y-5 print:space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> AI insights</h2>
          <p className="text-lg font-bold text-indigo-800 mt-1">{rep.headline}</p>
          <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${dq[rep.dataQuality.level]}`}>{rep.dataQuality.note}</span>
        </div>
        <div className="flex gap-2 print:hidden">
          <button className={btnGhost} onClick={copy}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : role === 'parent' ? 'Copy for therapist' : 'Copy summary'}</button>
          <button className={btnGhost} onClick={() => window.print()} aria-label="Print"><Printer className="w-4 h-4" /></button>
          <button className={btnGhost} onClick={() => writeAi(true)} disabled={busy} aria-label="Regenerate"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2"><span>Summary</span><span>{label}</span></div>
        {ai || !busy ? <p className="text-[15px] leading-relaxed text-slate-800">{summary}</p> : <div className="space-y-2" aria-busy><div className="h-3 bg-slate-100 rounded w-full" /><div className="h-3 bg-slate-100 rounded w-5/6" /><div className="h-3 bg-slate-100 rounded w-4/6" /></div>}
      </Card>

      <section>
        <h3 className="font-bold mb-2">This week vs last week</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{rep.changed.map((c: any) => {
          const I = c.delta === null || c.delta === 0 ? Minus : c.delta < 0 ? TrendingDown : TrendingUp;
          return (<Card key={c.title} className="!p-3.5"><div className="text-xs text-slate-500">{c.title}</div><div className="text-2xl font-bold mt-0.5">{c.now}</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${tone[c.tone]}`}>{c.delta !== null && <I className="w-3.5 h-3.5" />}{c.before ? `was ${c.before}` : c.tone === 'good' ? 'on track' : c.tone === 'watch' ? 'needs attention' : ' '}</div></Card>);
        })}</div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="!border-emerald-200">
          <h3 className="font-bold flex items-center gap-2 text-emerald-800"><ThumbsUp className="w-4 h-4" /> What is working</h3>
          {rep.working.length === 0 ? <p className="text-sm text-slate-500 mt-2">Nothing stands out yet. Keep logging what helps.</p> : <ul className="mt-3 space-y-3">{rep.working.map((f: any) => <li key={f.id} className="text-sm"><div className="font-bold">{f.title}</div><div className="text-slate-600">{f.detail}</div>{f.suggestion && <div className="text-xs text-emerald-800 mt-0.5">{f.suggestion}</div>}</li>)}</ul>}
        </Card>
        <Card className="!border-amber-200">
          <h3 className="font-bold flex items-center gap-2 text-amber-800"><AlertTriangle className="w-4 h-4" /> What to watch</h3>
          {rep.watch.length === 0 ? <p className="text-sm text-slate-500 mt-2">No concerns in the data right now.</p> : <ul className="mt-3 space-y-3">{rep.watch.map((f: any) => <li key={f.id} className="text-sm"><div className="font-bold">{f.title}</div><div className="text-slate-600">{f.detail}</div>{f.suggestion && <div className="text-xs text-amber-800 mt-0.5">{f.suggestion}</div>}</li>)}</ul>}
        </Card>
      </div>

      {rep.risk.length > 0 && (
        <Card>
          <h3 className="font-bold flex items-center gap-2"><Clock3 className="w-4 h-4 text-indigo-600" /> When to be extra ready</h3>
          <div className="grid md:grid-cols-3 gap-3 mt-3">{rep.risk.map((r: any) => <div key={r.label} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="font-bold">{r.label}</div><div className="text-slate-600 mt-0.5">{r.detail}</div><div className="text-xs text-indigo-800 mt-1.5">{r.tip}</div></div>)}</div>
        </Card>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-2"><h3 className="font-bold">Action plan</h3><span className="text-xs text-slate-400">{actions.filter((a) => done[a.title]).length}/{actions.length} done</span></div>
        {actions.length === 0 ? <Card className="text-sm text-slate-500">No actions yet. Log a few episodes to get a plan.</Card> : (
          <div className="space-y-4">{WHENS.map((w) => { const list = actions.filter((a) => (WHENS.includes(a.when) ? a.when : 'Ongoing') === w); return list.length ? (
            <div key={w}><div className="text-xs font-bold text-slate-500 mb-1.5">{w}</div>
              <div className="space-y-2">{list.map((a) => (
                <Card key={a.title} className="!p-3.5 flex gap-3">
                  <button onClick={() => toggle(a.title)} aria-pressed={!!done[a.title]} aria-label={`Mark "${a.title}" ${done[a.title] ? 'not done' : 'done'}`} className={`w-6 h-6 mt-0.5 shrink-0 rounded-md border-2 flex items-center justify-center ${done[a.title] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>{done[a.title] && <Check className="w-4 h-4" />}</button>
                  <div className={`min-w-0 flex-1 ${done[a.title] ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2 flex-wrap"><span className={`font-bold text-sm ${done[a.title] ? 'line-through' : ''}`}>{a.title}</span><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pri[a.priority]}`}>{a.priority}</span></div>
                    {a.why && <div className="text-xs text-slate-500 mt-0.5">{a.why}</div>}
                    {a.how && <div className="text-sm mt-1">{a.how}</div>}
                  </div>
                </Card>))}</div></div>) : null; })}</div>)}
      </section>

      {role === 'therapist' && (rep.clinical || []).length > 0 && (
        <Card><h3 className="font-bold flex items-center gap-2"><Stethoscope className="w-4 h-4 text-indigo-600" /> Clinical notes</h3>
          <ul className="mt-3 divide-y divide-slate-100">{(rep.clinical || []).map((c: any, i: number) => <li key={i} className="py-2.5 text-sm"><div className="font-bold">{c.title}</div><div className="text-slate-600">{c.detail}</div></li>)}</ul></Card>
      )}
      {questions.length > 0 && (
        <Card className="!bg-indigo-50 !border-indigo-100"><h3 className="font-bold flex items-center gap-2 text-indigo-900"><MessageCircleQuestion className="w-4 h-4" /> {role === 'parent' ? 'Questions to ask your therapist' : 'Talking points for the parent'}</h3>
          <ul className="mt-2 space-y-1.5 text-sm list-disc pl-5 text-slate-700">{questions.map((q, i) => <li key={i}>{q}</li>)}</ul></Card>
      )}
      <p className="text-[11px] text-slate-400">General guidance based on logged data. Not medical advice. Discuss changes with your therapist.</p>
    </div>
  );
}
