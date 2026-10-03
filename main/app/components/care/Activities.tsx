'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Star, CalendarPlus, Clock, X, Check, Sparkles } from 'lucide-react';
import { Card, btnPrimary, btnGhost } from '../learning/ui';
import { call, send, del, today } from './api';

const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const dayLabel = (d: string) => (d === today() ? 'Today' : d === tomorrow() ? 'Tomorrow' : new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));

export default function Activities({ childId, name, toast, readOnly = false }: { childId: string; name: string; toast: (m: string) => void; readOnly?: boolean }) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [cat, setCat] = useState('All');
  const [favOnly, setFavOnly] = useState(false);
  const [sel, setSel] = useState<any>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => { try { setD(await call(`/api/children/${childId}/activities`)); setErr(''); } catch (e: any) { setErr(e.message); } }, [childId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (d && sel) setSel(d.items.find((i: any) => i._id === sel._id) || null); }, [d]); // eslint-disable-line
  const list = useMemo(() => (d ? d.items.filter((a: any) => (cat === 'All' || a.category === cat) && (!favOnly || a.favoriteId)) : []), [d, cat, favOnly]);

  if (err && !d) return <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">Could not load activities ({err}).</Card>;
  if (!d) return <p className="text-sm text-slate-500">Loading activities…</p>;

  const act = async (fn: () => Promise<any>, msg: string) => { try { await fn(); toast(msg); load(); } catch (e: any) { toast(e.message); } };
  const fav = (a: any) => act(() => send(`/api/children/${childId}/activity-plan`, { activityId: a._id, kind: 'favorite' }), a.favoriteId ? 'Removed from favorites' : 'Saved to favorites');
  const plan = (a: any, date: string) => act(() => send(`/api/children/${childId}/activity-plan`, { activityId: a._id, kind: 'planned', date }), `Planned for ${dayLabel(date).toLowerCase()}`);
  const unplan = (a: any) => act(() => del(`/api/children/${childId}/activity-plan/${a.plannedId}`), 'Removed from plan');
  const rate = async (a: any, rating: string) => {
    await act(async () => {
      await send(`/api/activities/${a._id}/feedback`, { childId, rating, notes: note.trim() || undefined });
      if (a.plannedId) await del(`/api/children/${childId}/activity-plan/${a.plannedId}`);
    }, rating === 'Completed' ? 'Logged as completed' : 'Logged as too hard. We will suggest simpler ones');
    setNote(''); setSel(null);
  };

  const picks = d.items.filter((a: any) => a.fit >= 70 && !a.plannedId).slice(0, 3);
  const Star_ = (a: any) => readOnly ? null : <button onClick={(e) => { e.stopPropagation(); fav(a); }} aria-pressed={!!a.favoriteId} aria-label={a.favoriteId ? 'Remove favorite' : 'Add favorite'} className="p-1.5 rounded-md hover:bg-slate-100"><Star className={`w-5 h-5 ${a.favoriteId ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div><h2 className="text-xl font-bold">Activities</h2><p className="text-sm text-slate-500">{d.completedThisWeek} completed this week</p></div>
      </div>

      {d.plan.length > 0 && (
        <Card className="space-y-2">
          <h3 className="font-bold">Coming up</h3>
          {d.plan.map((a: any) => (
            <div key={a._id} className="flex items-center gap-3 text-sm py-1.5">
              <span className="w-20 shrink-0 text-xs font-bold text-indigo-700">{dayLabel(a.plannedDate)}</span>
              <button className="flex-1 text-left font-medium hover:underline" onClick={() => setSel(a)}>{a.title}</button>
              <span className="text-xs text-slate-400">{a.minutes} min</span>
              {!readOnly && <button onClick={() => unplan(a)} aria-label={`Remove ${a.title} from plan`} className="p-1 text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>}
            </div>))}
        </Card>
      )}

      {picks.length > 0 && cat === 'All' && !favOnly && (
        <section>
          <h3 className="font-bold flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-indigo-600" /> Picked for {name}</h3>
          <div className="grid md:grid-cols-3 gap-3">{picks.map((a: any) => (
            <Card key={a._id} className="!bg-indigo-50 !border-indigo-100 flex flex-col">
              <button className="text-left flex-1" onClick={() => setSel(a)}><div className="font-bold">{a.title}</div><div className="text-xs text-indigo-800 mt-1">{a.why.slice(0, 2).join(' · ')}</div></button>
              {!readOnly && <button onClick={() => plan(a, today())} className="mt-3 text-sm font-bold text-indigo-700 flex items-center gap-1.5"><CalendarPlus className="w-4 h-4" /> Plan for today</button>}
            </Card>))}</div>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter activities">
        {['All', ...d.categories].map((c: string) => <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${cat === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300 text-slate-600'}`}>{c}</button>)}
        <button aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap flex items-center gap-1.5 ${favOnly ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-300 text-slate-600'}`}><Star className="w-3.5 h-3.5" />Favorites</button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((a: any) => (
          <Card key={a._id} className="flex flex-col !p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">{a.category}</span>{Star_(a)}
            </div>
            <button className="text-left flex-1 mt-1" onClick={() => setSel(a)}>
              <div className="font-bold">{a.title}</div>
              <p className="text-sm text-slate-500 mt-1">{a.description}</p>
            </button>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
              {a.minutes && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.minutes} min</span>}
              <span>Ages {a.minAge}–{a.maxAge}</span>
              {a.timesCompleted > 0 && <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" />{a.timesCompleted}×</span>}
              {a.lastRating && /difficult/i.test(a.lastRating) && <span className="text-amber-700 font-medium">Too hard last time</span>}
            </div>
          </Card>))}
        {!list.length && <p className="text-sm text-slate-500 col-span-full">{favOnly ? 'No favorites yet. Tap the star on an activity you want to keep close.' : 'No activities in this category.'}</p>}
      </div>

      {sel && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setSel(null)}>
          <div className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-3"><div><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">{sel.category}</span><h3 className="text-xl font-bold mt-1.5">{sel.title}</h3></div><div className="flex"><span>{Star_(sel)}</span><button onClick={() => setSel(null)} aria-label="Close" className="p-1.5"><X className="w-5 h-5 text-slate-400" /></button></div></div>
            <p className="text-sm text-slate-600">{sel.description}</p>
            {sel.why?.length > 0 && <p className="text-xs text-indigo-800 bg-indigo-50 rounded-lg px-3 py-2">Why it fits {name}: {sel.why.join(', ')}.</p>}
            {sel.materials?.length > 0 && <div><div className="text-xs font-bold text-slate-500 mb-1">You need</div><ul className="text-sm list-disc pl-5">{sel.materials.map((m: string) => <li key={m}>{m}</li>)}</ul></div>}
            {sel.steps?.length > 0 && <div><div className="text-xs font-bold text-slate-500 mb-1.5">How to do it · about {sel.minutes} min</div><ol className="space-y-2">{sel.steps.map((s: string, i: number) => <li key={i} className="flex gap-3 text-sm"><span className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>{s}</li>)}</ol></div>}
            {sel.lastNote && <p className="text-xs text-slate-500 border-l-2 border-slate-200 pl-3">Last time: {sel.lastNote}</p>}
            {!readOnly && <div className="border-t border-slate-100 pt-4 space-y-3">
              {sel.plannedId ? <div className="text-sm text-indigo-700 font-medium">Planned for {dayLabel(sel.plannedDate)}</div> : <div className="flex gap-2"><button className={btnGhost} onClick={() => plan(sel, today())}><CalendarPlus className="w-4 h-4" />Today</button><button className={btnGhost} onClick={() => plan(sel, tomorrow())}>Tomorrow</button></div>}
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it go? (optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2"><button className={btnPrimary} onClick={() => rate(sel, 'Completed')}>We did it</button><button className={btnGhost} onClick={() => rate(sel, 'Too Difficult')}>Too hard</button></div>
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}
