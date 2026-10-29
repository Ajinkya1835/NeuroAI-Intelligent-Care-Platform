'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Users, Plus, Pencil, Trash2, Check, X, Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, Bar, btnPrimary, btnGhost } from '../learning/ui';
import { call, send, del } from './api';

const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-500';
const lvl: Record<string, string> = { high: 'bg-rose-100 text-rose-800', medium: 'bg-amber-100 text-amber-800', low: 'bg-slate-100 text-slate-600' };
const ago = (d: string | null) => (d ? `${Math.floor((Date.now() - new Date(d).getTime()) / 864e5)}d ago` : 'never');

export default function TherapistHub({ activeId, onPick, toast }: { activeId: string; onPick: (id: string) => void; toast: (m: string) => void }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [rev, setRev] = useState({ goalId: '', score: 50, obs: '' });
  const [ng, setNg] = useState({ area: '', title: '', targetScore: 80 });
  const [edit, setEdit] = useState<any>(null);
  const [ms, setMs] = useState('');
  const [pn, setPn] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [c, g, n] = await Promise.all([call('/api/therapist/caseload'), call(`/api/children/${activeId}/goals`), call(`/api/children/${activeId}/notes`)]);
      setRows(c); setGoals(g); setNotes(n.filter((x: any) => x.private)); setErr('');
      setRev((r) => ({ ...r, goalId: g.find((x: any) => x._id === r.goalId) ? r.goalId : g[0]?._id || '' }));
    } catch (e: any) { setErr(e.message); }
  }, [activeId]);
  useEffect(() => { loadAll(); }, [loadAll]);

  const run = async (fn: () => Promise<any>, ok: string, after?: () => void) => { try { await fn(); toast(ok); after?.(); loadAll(); } catch (e: any) { toast(e.message); } };
  const cur = rows?.find((r) => r._id === activeId);
  const selGoal = goals.find((g) => g._id === rev.goalId);

  if (err && !rows) return <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">Could not load your caseload ({err}). <button className="underline font-medium" onClick={loadAll}>Retry</button></Card>;
  if (!rows) return <p className="text-sm text-slate-500">Loading your caseload…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Your caseload</h2>
        <p className="text-sm text-slate-500">Children who need attention are listed first. Select one to work on their goals and notes.</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {rows.map((r) => {
          const T = r.trend === 'improving' ? TrendingDown : r.trend === 'worsening' ? TrendingUp : Minus;
          return (
            <button key={r._id} onClick={() => onPick(r._id)} aria-pressed={r._id === activeId} className={`text-left rounded-xl border p-4 bg-white transition ${r._id === activeId ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}`}>
              <div className="flex items-center justify-between gap-2"><div className="font-bold">{r.name} <span className="font-normal text-slate-400 text-sm">{r.age} yrs</span></div>{r.flags.some((f: any) => f.level === 'high') && <AlertTriangle className="w-4 h-4 text-rose-600" aria-label="Needs attention" />}</div>
              <div className="text-xs text-slate-500">Parent: {r.parent || '–'}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div><div className="font-bold text-lg flex items-center justify-center gap-1">{r.episodes7d}<T className={`w-3.5 h-3.5 ${r.trend === 'worsening' ? 'text-rose-600' : r.trend === 'improving' ? 'text-emerald-600' : 'text-slate-400'}`} /></div><div className="text-[11px] text-slate-500">episodes (7d)</div></div>
                <div><div className="font-bold text-lg">{r.adherencePct ?? '–'}{r.adherencePct !== null && '%'}</div><div className="text-[11px] text-slate-500">routines</div></div>
                <div><div className="font-bold text-lg">{r.goalsReached}/{r.goalsTotal}</div><div className="text-[11px] text-slate-500">goals</div></div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">{r.flags.length ? r.flags.map((f: any, i: number) => <span key={i} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${lvl[f.level]}`}>{f.text}</span>) : <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">On track</span>}</div>
              <div className="text-[11px] text-slate-400 mt-2">Last review {ago(r.lastReview)}</div>
            </button>);
        })}
        {!rows.length && <Card className="col-span-full text-center py-8 text-sm text-slate-500">No children have been shared with you yet. Ask a parent to grant you access.</Card>}
      </div>

      {cur && (
        <>
          <h3 className="text-lg font-bold border-t border-slate-200 pt-5">Working with {cur.name}</h3>
          <div className="grid lg:grid-cols-2 gap-5 items-start">
            <Card className="space-y-3">
              <h4 className="font-bold">Review a goal</h4>
              {goals.length === 0 ? <p className="text-sm text-slate-500">Add a goal first, then record progress against it.</p> : (
                <>
                  <select className={inp} value={rev.goalId} onChange={(e) => setRev({ ...rev, goalId: e.target.value })} aria-label="Goal">{goals.map((g) => <option key={g._id} value={g._id}>{g.title} ({g.area})</option>)}</select>
                  {selGoal && <div className="text-xs text-slate-500">Now {selGoal.currentScore}/{selGoal.targetScore}</div>}
                  <label className="block text-xs font-medium text-slate-600">Score: {rev.score}/100<input type="range" min={0} max={100} value={rev.score} onChange={(e) => setRev({ ...rev, score: Number(e.target.value) })} className="w-full accent-indigo-600" /></label>
                  <input className={inp} placeholder="What did you observe? (visible to the parent)" value={rev.obs} onChange={(e) => setRev({ ...rev, obs: e.target.value })} />
                  <button className={btnPrimary} onClick={() => run(() => send(`/api/children/${activeId}/progress`, { goalId: rev.goalId, score: rev.score, obs: rev.obs }), 'Review saved', () => setRev({ ...rev, obs: '' }))}>Save review</button>
                </>)}
            </Card>

            <Card className="space-y-3">
              <h4 className="font-bold">Goals</h4>
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.currentScore / (g.targetScore || 100)) * 100));
                return edit?._id === g._id ? (
                  <div key={g._id} className="space-y-2 rounded-lg bg-slate-50 p-3">
                    <input className={inp} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} aria-label="Goal title" />
                    <label className="text-xs text-slate-600">Target <input type="number" min={1} max={100} className={inp + ' mt-1'} value={edit.targetScore} onChange={(e) => setEdit({ ...edit, targetScore: Number(e.target.value) })} /></label>
                    <div className="flex gap-2"><button className={btnPrimary} onClick={() => run(() => send(`/api/goals/${g._id}`, { title: edit.title, targetScore: edit.targetScore }, 'PUT'), 'Goal updated', () => setEdit(null))}><Check className="w-4 h-4" />Save</button><button className={btnGhost} onClick={() => setEdit(null)}><X className="w-4 h-4" />Cancel</button></div>
                  </div>
                ) : (
                  <div key={g._id}>
                    <div className="flex justify-between gap-2 text-sm"><span><b>{g.title}</b> <span className="text-xs text-slate-400">{g.area}</span></span>
                      <span className="flex items-center gap-1 shrink-0"><span className="text-slate-500 mr-1">{g.currentScore}/{g.targetScore}</span>
                        <button aria-label={`Edit ${g.title}`} onClick={() => setEdit(g)} className="p-1 text-slate-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                        <button aria-label={`Delete ${g.title}`} onClick={() => confirm(`Delete goal "${g.title}"?`) && run(() => del(`/api/goals/${g._id}`), 'Goal deleted')} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button></span></div>
                    <div className="mt-1"><Bar percent={pct} color={pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'} label={g.title} /></div>
                  </div>);
              })}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="text-xs font-bold text-slate-500">New goal</div>
                <div className="grid grid-cols-2 gap-2"><input className={inp} placeholder="Area, e.g. Emotions" list="goal-areas" value={ng.area} onChange={(e) => setNg({ ...ng, area: e.target.value })} /><datalist id="goal-areas">{[...new Set(goals.map((g) => g.area))].map((a) => <option key={a} value={a} />)}</datalist>
                  <input type="number" min={1} max={100} className={inp} value={ng.targetScore} onChange={(e) => setNg({ ...ng, targetScore: Number(e.target.value) })} aria-label="Target score" /></div>
                <input className={inp} placeholder="Goal title" value={ng.title} onChange={(e) => setNg({ ...ng, title: e.target.value })} />
                <button className={btnGhost} disabled={!ng.area.trim() || !ng.title.trim()} onClick={() => run(() => send(`/api/children/${activeId}/goals`, ng), 'Goal added', () => setNg({ area: '', title: '', targetScore: 80 }))}><Plus className="w-4 h-4" />Add goal</button>
              </div>
            </Card>

            <Card className="space-y-3">
              <h4 className="font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> Private clinical notes</h4>
              <p className="text-xs text-slate-500">Only therapists with access to {cur.name} can see these. Parents cannot.</p>
              <textarea className={inp} rows={3} value={pn} onChange={(e) => setPn(e.target.value)} placeholder="Session observations, hypotheses, plans…" />
              <button className={btnPrimary} disabled={!pn.trim()} onClick={() => run(() => send(`/api/children/${activeId}/notes`, { text: pn, private: true }), 'Private note saved', () => setPn(''))}>Save private note</button>
              <ul className="divide-y divide-slate-100">{notes.map((n) => <li key={n._id} className="py-2.5 text-sm"><div className="text-xs text-slate-400">{n.author} · {new Date(n.ts).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div><p>{n.text}</p></li>)}{!notes.length && <li className="text-sm text-slate-400 py-1">No private notes yet.</li>}</ul>
            </Card>

            <Card className="space-y-3">
              <h4 className="font-bold">Milestone reached</h4>
              <input className={inp} placeholder="e.g. Asked for a break without prompting" value={ms} onChange={(e) => setMs(e.target.value)} />
              <button className={btnGhost} disabled={!ms.trim()} onClick={() => run(() => send(`/api/children/${activeId}/milestones`, { title: ms }), 'Milestone added', () => setMs(''))}><Plus className="w-4 h-4" />Add milestone</button>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
