'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Download, Pencil, Trash2, X, Clock, MapPin, ChevronDown } from 'lucide-react';
import { Card, btnPrimary, btnGhost } from '../learning/ui';
import { call, send, del } from './api';

const sevCls = ['', 'bg-emerald-100 text-emerald-800', 'bg-emerald-100 text-emerald-800', 'bg-amber-100 text-amber-800', 'bg-orange-100 text-orange-800', 'bg-rose-100 text-rose-800'];
const when = (d: string) => new Date(d).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-500';

function EditModal({ ep, onClose, onSaved, toast }: { ep: any; onClose: () => void; onSaved: () => void; toast: (m: string) => void }) {
  const [v, setV] = useState({ ...ep });
  const [busy, setBusy] = useState(false);
  const num = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value === '' ? undefined : Number(e.target.value) });
  const save = async () => { setBusy(true); try { await send(`/api/episodes/${ep._id}`, { intensity: v.intensity, trigger: v.trigger, location: v.location, activity: v.activity, durationMinutes: v.durationMinutes, recoveryMinutes: v.recoveryMinutes, response: v.response, notes: v.notes }, 'PUT'); toast('Episode updated'); onSaved(); onClose(); } catch (e: any) { toast(e.message); } setBusy(false); };
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between"><h3 className="font-bold text-lg">Edit episode</h3><button onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button></div>
        <label className="block text-xs font-medium text-slate-600">Intensity: {v.intensity}/5<input type="range" min={1} max={5} value={v.intensity} onChange={num('intensity')} className="w-full accent-indigo-600" /></label>
        {[['Trigger', 'trigger'], ['What was happening', 'activity'], ['Location', 'location'], ['How you responded', 'response'], ['Notes', 'notes']].map(([l, k]) => <label key={k} className="block text-xs font-medium text-slate-600">{l}<input className={inp + ' mt-1'} value={v[k] || ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></label>)}
        <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium text-slate-600">Duration (min)<input type="number" className={inp + ' mt-1'} value={v.durationMinutes ?? ''} onChange={num('durationMinutes')} /></label><label className="block text-xs font-medium text-slate-600">Recovery (min)<input type="number" className={inp + ' mt-1'} value={v.recoveryMinutes ?? ''} onChange={num('recoveryMinutes')} /></label></div>
        <div className="flex justify-end gap-2 pt-2"><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      </div>
    </div>
  );
}

export default function Episodes({ childId, onLog, toast, version, readOnly = false }: { childId: string; onLog: () => void; toast: (m: string) => void; version: number; readOnly?: boolean }) {
  const [q, setQ] = useState('');
  const [trigger, setTrigger] = useState('');
  const [level, setLevel] = useState<'all' | 'mild' | 'moderate' | 'severe'>('all');
  const [range, setRange] = useState(0);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState<any>(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (trigger) p.set('trigger', trigger);
    if (level === 'mild') p.set('max', '2'); if (level === 'moderate') { p.set('min', '3'); p.set('max', '3'); } if (level === 'severe') p.set('min', '4');
    if (range) p.set('from', new Date(Date.now() - range * 864e5).toISOString().slice(0, 10));
    try { setData(await call(`/api/children/${childId}/episodes/search?${p}`)); setErr(''); } catch (e: any) { setErr(e.message); }
  }, [childId, q, trigger, level, range]);
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load, version]); // eslint-disable-line

  const remove = async (e: any) => { if (!confirm('Delete this episode? This also changes your patterns.')) return; try { await del(`/api/episodes/${e._id}`); toast('Episode deleted'); load(); } catch (x: any) { toast(x.message); } };
  const csv = () => {
    const cols = ['ts', 'intensity', 'trigger', 'location', 'activity', 'durationMinutes', 'recoveryMinutes', 'behaviors', 'calmingInterventions', 'response', 'notes'];
    const esc = (v: any) => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""')}"`;
    const blob = new Blob([[cols.join(','), ...data.items.map((e: any) => cols.map((c) => esc(e[c])).join(','))].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'episodes.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  const s = data?.summary;
  const pill = (on: boolean) => `px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300 text-slate-600'}`;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Episodes</h2>
        <div className="flex gap-2"><button className={btnGhost} onClick={csv} disabled={!data?.items.length}><Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span></button>{!readOnly && <button className={btnPrimary} onClick={onLog}><Plus className="w-4 h-4" /> Log episode</button>}</div>
      </div>

      <div className="relative"><Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trigger, place, behavior, notes" aria-label="Search episodes" className={inp + ' pl-9'} /></div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filters">
        {([['all', 'Any intensity'], ['mild', 'Mild 1–2'], ['moderate', 'Moderate 3'], ['severe', 'Severe 4–5']] as const).map(([k, l]) => <button key={k} aria-pressed={level === k} className={pill(level === k)} onClick={() => setLevel(k)}>{l}</button>)}
        <span className="w-px bg-slate-200 mx-1" />
        {[[0, 'All time'], [7, '7 days'], [30, '30 days']].map(([k, l]) => <button key={k} aria-pressed={range === k} className={pill(range === k)} onClick={() => setRange(k as number)}>{l}</button>)}
      </div>
      {data?.triggers.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{data.triggers.map((t: string) => <button key={t} aria-pressed={trigger === t} className={pill(trigger === t) + ' !text-xs'} onClick={() => setTrigger(trigger === t ? '' : t)}>{t}</button>)}</div>}

      {s && <div className="grid grid-cols-4 gap-2">{[['Shown', s.count], ['Avg intensity', s.avgIntensity ?? '–'], ['Avg length', s.avgDuration != null ? `${s.avgDuration}m` : '–'], ['Avg recovery', s.avgRecovery != null ? `${s.avgRecovery}m` : '–']].map(([l, v]) => <Card key={l as string} className="!p-3 text-center"><div className="text-lg font-bold">{v}</div><div className="text-[11px] text-slate-500">{l}</div></Card>)}</div>}

      {err && <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">Could not load episodes ({err}).</Card>}
      {data && !data.items.length && <Card className="text-center py-10"><p className="font-bold">{q || trigger || level !== 'all' || range ? 'No episodes match these filters' : 'No episodes logged yet'}</p><p className="text-sm text-slate-500 mt-1">{q || trigger || level !== 'all' || range ? 'Clear a filter to see more.' : readOnly ? 'The parent has not logged any episodes yet.' : 'Logging takes about a minute and powers every pattern in the app.'}</p></Card>}

      <div className="space-y-2.5">{data?.items.map((e: any) => (
        <Card key={e._id} className="!p-0 overflow-hidden">
          <button onClick={() => setOpen(open === e._id ? null : e._id)} aria-expanded={open === e._id} className="w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50">
            <span className={`w-10 h-10 shrink-0 rounded-xl font-bold text-lg flex items-center justify-center ${sevCls[e.intensity]}`} aria-label={`Intensity ${e.intensity} of 5`}>{e.intensity}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold truncate">{e.trigger || 'Episode'}</span>
              <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5"><span>{when(e.ts)}</span>{e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}{e.durationMinutes != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.durationMinutes} min</span>}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 mt-1 transition ${open === e._id ? 'rotate-180' : ''}`} />
          </button>
          {open === e._id && (
            <div className="px-4 pb-4 text-sm space-y-3 border-t border-slate-100 pt-3">
              {e.activity && <div><span className="text-xs font-bold text-slate-500">What was happening</span><div>{e.activity}</div></div>}
              {e.behaviors?.length > 0 && <div className="flex flex-wrap gap-1.5">{e.behaviors.map((b: string) => <span key={b} className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs">{b}</span>)}</div>}
              {e.response && <div><span className="text-xs font-bold text-slate-500">How you responded</span><div>{e.response}</div></div>}
              {e.calmingInterventions?.length > 0 && <div><span className="text-xs font-bold text-slate-500">What helped{e.recoveryMinutes != null ? ` · recovered in ${e.recoveryMinutes} min` : ''}</span><div className="flex flex-wrap gap-1.5 mt-1">{e.calmingInterventions.map((b: string) => <span key={b} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs">{b}</span>)}</div></div>}
              <div className="text-xs text-slate-500">{[e.sensoryEnvironment && `Environment: ${e.sensoryEnvironment}`, e.sleepHours != null && `Sleep ${e.sleepHours}h`, e.hungerLevel && `Hunger: ${e.hungerLevel}`, e.postEpisodeBehavior && `Afterwards: ${e.postEpisodeBehavior}`].filter(Boolean).join(' · ')}</div>
              {e.notes && <p className="text-slate-600">{e.notes}</p>}
              {!readOnly && <div className="flex gap-3 pt-1"><button onClick={() => setEdit(e)} className="text-sm text-indigo-700 font-medium flex items-center gap-1.5"><Pencil className="w-4 h-4" />Edit</button><button onClick={() => remove(e)} className="text-sm text-rose-600 font-medium flex items-center gap-1.5"><Trash2 className="w-4 h-4" />Delete</button></div>}
            </div>)}
        </Card>))}</div>
      {edit && <EditModal ep={edit} onClose={() => setEdit(null)} onSaved={load} toast={toast} />}
    </div>
  );
}
