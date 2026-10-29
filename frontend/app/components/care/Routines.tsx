'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Check, SkipForward, Plus, Pencil, Trash2, Flame, ChevronDown, X, PauseCircle } from 'lucide-react';
import { Card, Bar, btnPrimary, btnGhost } from '../learning/ui';
import { call, send, del, shortDay } from './api';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CATS = ['Morning', 'School', 'Afternoon', 'Evening', 'Night'];
const blank = { title: '', category: 'Morning', scheduleTime: '08:00', supports: '', steps: [] as string[], days: [0, 1, 2, 3, 4, 5, 6] };
const cell: Record<string, string> = { completed: 'bg-emerald-500', skipped: 'bg-amber-400', pending: 'bg-slate-200', none: 'bg-slate-100' };

function Ring({ done, total }: { done: number; total: number }) {
  const r = 34, c = 2 * Math.PI * r, f = total ? done / total : 0;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${done} of ${total} done today`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#EAEFED" strokeWidth="9" />
      <circle cx="44" cy="44" r={r} fill="none" stroke="#327C84" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - f)} transform="rotate(-90 44 44)" style={{ transition: 'stroke-dashoffset .6s' }} />
      <text x="44" y="49" textAnchor="middle" fontSize="20" fontWeight="700" fill="#28332F">{done}/{total}</text>
    </svg>
  );
}

function Editor({ initial, onClose, onSave, onDelete, onPause }: { initial: any; onClose: () => void; onSave: (v: any) => Promise<void>; onDelete?: () => void; onPause?: () => void }) {
  const [v, setV] = useState({ ...blank, ...initial, steps: initial.steps || [] });
  const [step, setStep] = useState('');
  const [busy, setBusy] = useState(false);
  const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-500';
  const addStep = () => { if (step.trim()) { setV({ ...v, steps: [...v.steps, step.trim()] }); setStep(''); } };
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center"><h3 className="font-bold text-lg">{initial._id ? 'Edit routine' : 'New routine'}</h3><button onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button></div>
        <label className="block text-xs font-medium text-slate-600">Name<input className={inp + ' mt-1'} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="e.g. Pack school bag with picture list" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-slate-600">Time of day<select className={inp + ' mt-1'} value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="block text-xs font-medium text-slate-600">Start time<input type="time" className={inp + ' mt-1'} value={v.scheduleTime} onChange={(e) => setV({ ...v, scheduleTime: e.target.value })} /></label>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600 mb-1.5">Repeats on</div>
          <div className="flex gap-1.5">{DOW.map((d, i) => { const on = v.days.includes(i); return <button key={i} type="button" aria-pressed={on} aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]} onClick={() => setV({ ...v, days: on ? v.days.filter((x: number) => x !== i) : [...v.days, i] })} className={`w-9 h-9 rounded-full text-sm font-bold border ${on ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-slate-500'}`}>{d}</button>; })}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600 mb-1.5">Small steps <span className="font-normal text-slate-400">(shown as a visual checklist)</span></div>
          <ol className="space-y-1.5 mb-2">{v.steps.map((s: string, i: number) => <li key={i} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-1.5"><span className="font-bold text-slate-400 w-4">{i + 1}</span><span className="flex-1">{s}</span><button aria-label="Remove step" onClick={() => setV({ ...v, steps: v.steps.filter((_: any, j: number) => j !== i) })}><X className="w-4 h-4 text-slate-400" /></button></li>)}</ol>
          <div className="flex gap-2"><input className={inp} value={step} placeholder="Add a step" onChange={(e) => setStep(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())} /><button type="button" onClick={addStep} className={btnGhost}>Add</button></div>
        </div>
        <label className="block text-xs font-medium text-slate-600">What helps<input className={inp + ' mt-1'} value={v.supports} onChange={(e) => setV({ ...v, supports: e.target.value })} placeholder="e.g. Timer, headphones, favorite song" /></label>
        <div className="flex justify-between pt-2 border-t border-slate-100">
          {onDelete ? <span className="flex gap-1"><button onClick={onDelete} className="text-sm text-rose-600 flex items-center gap-1.5 px-2"><Trash2 className="w-4 h-4" /> Delete</button>{initial.active !== false && <button onClick={onPause} className="text-sm text-slate-500 flex items-center gap-1.5 px-2"><PauseCircle className="w-4 h-4" /> Pause</button>}</span> : <span />}
          <button disabled={!v.title.trim() || !v.days.length || busy} className={btnPrimary} onClick={async () => { setBusy(true); try { await onSave(v); } finally { setBusy(false); } }}>{busy ? 'Saving…' : 'Save routine'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Routines({ childId, toast, therapist = false }: { childId: string; toast: (m: string) => void; therapist?: boolean }) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [showPaused, setShowPaused] = useState(false);

  const load = useCallback(async () => { try { setD(await call(`/api/children/${childId}/routines/week`)); setErr(''); } catch (e: any) { setErr(e.message); } }, [childId]);
  useEffect(() => { load(); }, [load]);

  const mark = async (r: any, status: string) => {
    const next = r.todayStatus === status ? 'pending' : status;
    setD((p: any) => ({ ...p, items: p.items.map((i: any) => (i._id === r._id ? { ...i, todayStatus: next } : i)), today: { ...p.today, done: p.items.filter((i: any) => i.active && i.scheduledToday && (i._id === r._id ? next : i.todayStatus) === 'completed').length } }));
    try { await send(`/api/routines/${r._id}/log`, { status: next }); if (next === 'completed') toast('Nice work. Marked done.'); load(); } catch (e: any) { toast(e.message); load(); }
  };
  const save = async (v: any) => {
    const body = { title: v.title, category: v.category, scheduleTime: v.scheduleTime, supports: v.supports, steps: v.steps, days: v.days };
    try { v._id ? await send(`/api/routines/${v._id}`, body, 'PUT') : await send(`/api/children/${childId}/routines`, body); setEdit(null); toast(v._id ? 'Routine updated' : 'Routine added'); load(); } catch (e: any) { toast(e.message); }
  };
  const toggleActive = async (r: any) => { await send(`/api/routines/${r._id}`, { active: !r.active }, 'PUT'); load(); };
  const remove = async (r: any) => { if (!confirm(`Delete "${r.title}" and its history?`)) return; await del(`/api/routines/${r._id}`); setEdit(null); toast('Routine deleted'); load(); };

  if (err && !d) return <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">Could not load routines ({err}). <button className="underline font-medium" onClick={load}>Retry</button></Card>;
  if (!d) return <p className="text-sm text-slate-500">Loading routines…</p>;

  const active = d.items.filter((i: any) => i.active);
  const paused = d.items.filter((i: any) => !i.active);
  const dueToday = active.filter((i: any) => i.scheduledToday);
  const later = active.filter((i: any) => !i.scheduledToday);
  const allDone = dueToday.length > 0 && d.today.done === dueToday.length;

  const Row = (r: any) => (
    <Card key={r._id} className="!p-0 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <button disabled={therapist || !r.scheduledToday} onClick={() => mark(r, 'completed')} aria-label={r.todayStatus === 'completed' ? `Undo ${r.title}` : `Mark ${r.title} done`}
          className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition ${r.todayStatus === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-indigo-500 hover:text-indigo-300 disabled:opacity-40'}`}><Check className="w-6 h-6" /></button>
        <div className="flex-1 min-w-0">
          <div className={`font-bold ${r.todayStatus === 'completed' ? 'text-slate-400 line-through' : ''}`}>{r.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{r.scheduleTime || r.category}{r.supports ? ` · ${r.supports}` : ''}{!r.scheduledToday ? ' · not today' : ''}</div>
          <div className="flex items-center gap-3 mt-2.5">
            <div className="flex gap-1" aria-label="Last 7 days">{r.grid.map((g: any) => <div key={g.date} title={`${g.date}: ${g.scheduled ? g.status : 'not scheduled'}`} className="text-center"><div className={`w-6 h-6 rounded-md ${g.scheduled ? cell[g.status] : 'bg-transparent border border-dashed border-slate-200'}`} /><div className="text-[9px] text-slate-400 mt-0.5">{shortDay(g.date)}</div></div>)}</div>
            <div className="text-xs text-slate-500 space-y-0.5">
              {r.streak > 1 && <div className="flex items-center gap-1 text-amber-600 font-bold"><Flame className="w-3.5 h-3.5" />{r.streak} in a row</div>}
              {r.adherencePct !== null && <div>{r.adherencePct}% this week</div>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {!therapist && r.scheduledToday && r.todayStatus !== 'completed' && <button onClick={() => mark(r, 'skipped')} className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${r.todayStatus === 'skipped' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}><SkipForward className="w-3.5 h-3.5" />{r.todayStatus === 'skipped' ? 'Skipped' : 'Skip'}</button>}
          <button onClick={() => setEdit(r)} aria-label={`Edit ${r.title}`} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
        </div>
      </div>
      {r.steps.length > 0 && (
        <>
          <button onClick={() => setOpen(open === r._id ? null : r._id)} aria-expanded={open === r._id} className="w-full px-4 py-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between hover:bg-slate-50">{r.steps.length} steps<ChevronDown className={`w-4 h-4 transition ${open === r._id ? 'rotate-180' : ''}`} /></button>
          {open === r._id && <ol className="px-4 pb-4 space-y-2">{r.steps.map((s: string, i: number) => <li key={i} className="flex gap-3 text-sm"><span className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>{s}</li>)}</ol>}
        </>
      )}
    </Card>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Routines</h2>
        <button className={btnPrimary} onClick={() => setEdit(blank)}><Plus className="w-4 h-4" /> New routine</button>
      </div>

      <Card className="flex items-center gap-5">
        <Ring done={d.today.done} total={d.today.total} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg">{allDone ? 'All done for today' : d.today.total === 0 ? 'Nothing scheduled today' : `${d.today.total - d.today.done} left today`}</div>
          <div className="text-sm text-slate-500 mt-0.5">{d.adherencePct !== null ? `${d.adherencePct}% of tracked steps completed this week` : 'Mark a routine to start tracking'}{d.bestStreak > 1 ? ` · best streak ${d.bestStreak} days` : ''}</div>
          <div className="mt-2.5"><Bar percent={d.today.total ? (d.today.done / d.today.total) * 100 : 0} color="bg-emerald-500" label="Today's routines" /></div>
        </div>
      </Card>

      {d.needsAttention.length > 0 && (
        <Card className="!bg-amber-50 !border-amber-200 text-sm text-amber-900">
          <b>Worth a look:</b> {d.needsAttention.map((n: any) => `${n.title} (skipped ${n.skipped}× in 2 weeks)`).join(', ')}. Try fewer steps, a visual cue, or a different time.
        </Card>
      )}

      {CATS.map((cat) => {
        const list = dueToday.filter((r: any) => r.category === cat);
        return list.length ? <section key={cat} className="space-y-2.5"><h3 className="text-sm font-bold text-slate-500">{cat}</h3>{list.map(Row)}</section> : null;
      })}
      {dueToday.filter((r: any) => !CATS.includes(r.category)).map(Row)}
      {later.length > 0 && <section className="space-y-2.5"><h3 className="text-sm font-bold text-slate-500">Not scheduled today</h3>{later.map(Row)}</section>}
      {d.items.length === 0 && <Card className="text-center py-10"><p className="font-bold">No routines yet</p><p className="text-sm text-slate-500 mt-1">Start with one small step, like a morning visual schedule.</p><button className={btnPrimary + ' mt-4'} onClick={() => setEdit(blank)}>Add first routine</button></Card>}

      {paused.length > 0 && (
        <div>
          <button onClick={() => setShowPaused(!showPaused)} className="text-sm text-slate-500 flex items-center gap-1.5"><PauseCircle className="w-4 h-4" />{paused.length} paused</button>
          {showPaused && <div className="mt-2 space-y-2">{paused.map((r: any) => <Card key={r._id} className="!p-3 flex items-center justify-between text-sm"><span className="text-slate-500">{r.title}</span><button className="text-indigo-600 font-medium" onClick={() => toggleActive(r)}>Resume</button></Card>)}</div>}
        </div>
      )}
      {edit && <Editor initial={edit} onClose={() => setEdit(null)} onSave={(v) => save(v)} onDelete={edit._id && !therapist ? () => remove(edit) : undefined} onPause={() => { toggleActive(edit); setEdit(null); toast('Routine paused'); }} />}
    </div>
  );
}
