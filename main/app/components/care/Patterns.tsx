'use client';
import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, Minus, Lightbulb } from 'lucide-react';
import { Card, Bar } from '../learning/ui';
import { call } from './api';

const heat = (n: number, max: number) => (n === 0 ? '#F5F7F6' : ['#D5E9EA', '#AFD3D6', '#7DB6BB', '#4F979E', '#276A71'][Math.min(4, Math.ceil((n / Math.max(1, max)) * 5) - 1)]);
const sev = ['', '#D5E9EA', '#AFD3D6', '#F2C879', '#E58A6B', '#C44536'];
const delta = (now: number | null, was: number | null) => (now === null || was === null ? null : Math.round((now - was) * 10) / 10);

function Delta({ v, lowerIsBetter = true, unit = '' }: { v: number | null; lowerIsBetter?: boolean; unit?: string }) {
  if (v === null) return null;
  const good = v === 0 ? null : lowerIsBetter ? v < 0 : v > 0;
  const I = v === 0 ? Minus : v < 0 ? TrendingDown : TrendingUp;
  return <span className={`inline-flex items-center gap-1 text-xs font-bold ${good === null ? 'text-slate-500' : good ? 'text-emerald-600' : 'text-rose-600'}`}><I className="w-3.5 h-3.5" />{v > 0 ? '+' : ''}{v}{unit} vs before</span>;
}

function Calendar({ daily, days }: { daily: any[]; days: number }) {
  const by = Object.fromEntries(daily.map((d) => [d.date, d]));
  const end = new Date(); end.setHours(12, 0, 0, 0);
  const start = new Date(end); start.setDate(start.getDate() - (days - 1));
  const lead = (start.getDay() + 6) % 7; // Monday first
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let i = 0; i < days; i++) { const d = new Date(start); d.setDate(d.getDate() + i); cells.push(d.toISOString().slice(0, 10)); }
  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1" style={{ gridTemplateRows: 'repeat(7, 1.5rem)' }}>
        {cells.map((c, i) => c ? <div key={c} title={by[c] ? `${c}: ${by[c].count} episode(s), peak ${by[c].maxIntensity}/5` : `${c}: calm day`} className="w-6 h-6 rounded-md" style={{ background: by[c] ? sev[by[c].maxIntensity] : '#EAEFED' }} /> : <div key={i} />)}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2"><span>Calm</span><span className="w-4 h-4 rounded bg-slate-100" />{[1, 2, 3, 4, 5].map((n) => <span key={n} className="w-4 h-4 rounded" style={{ background: sev[n] }} />)}<span>Peak intensity</span></div>
    </div>
  );
}

export default function Patterns({ childId, name }: { childId: string; name: string }) {
  const [days, setDays] = useState(30);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => { setD(null); call(`/api/children/${childId}/patterns/full?days=${days}`).then(setD).catch((e) => setErr(e.message)); }, [childId, days]);
  if (err && !d) return <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">Could not load patterns ({err}).</Card>;
  if (!d) return <p className="text-sm text-slate-500">Reading the data…</p>;

  const t = d.totals, g = d.weekdayByPart, gMax = Math.max(1, ...g.grid.flat());
  // plain-language takeaways, only from data that exists
  const tips: string[] = [];
  const flat: { r: number; c: number; n: number }[] = [];
  g.grid.forEach((row: number[], r: number) => row.forEach((n, c) => n && flat.push({ r, c, n })));
  const top = flat.sort((a, b) => b.n - a.n)[0];
  if (top && t.episodes >= 4) tips.push(`${g.weekdays[top.r]} ${g.parts[top.c].toLowerCase()} is the busiest slot (${top.n} of ${t.episodes} episodes). A calm check-in just before it may help.`);
  const tr = d.triggers.find((x: any) => x.bestStrategy && x.bestStrategy.n >= 2);
  if (tr) tips.push(`For "${tr.name}", ${tr.bestStrategy.name} had the quickest recovery (about ${tr.bestStrategy.avgRecovery} min).`);
  const rl = d.routineLink;
  if (rl.onTrack.count >= 3 && rl.slipping.count >= 3 && rl.onTrack.avg !== null && rl.slipping.avg !== null && rl.slipping.avg - rl.onTrack.avg >= 0.5)
    tips.push(`On days routines slipped, peak intensity averaged ${rl.slipping.avg}/5 versus ${rl.onTrack.avg}/5 on well-kept days.`);
  if (t.longestCalmStreak >= 5) tips.push(`Longest calm stretch: ${t.longestCalmStreak} days. Note what was different then.`);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold">Patterns</h2>
        <div role="tablist" aria-label="Time range" className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {[14, 30, 90].map((n) => <button key={n} role="tab" aria-selected={days === n} onClick={() => setDays(n)} className={`px-3 py-1.5 text-sm rounded-md font-medium ${days === n ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{n} days</button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4"><div className="text-xs text-slate-500">Episodes</div><div className="text-3xl font-bold mt-1">{t.episodes}</div><Delta v={delta(t.episodes, t.previous)} /></Card>
        <Card className="!p-4"><div className="text-xs text-slate-500">Average intensity</div><div className="text-3xl font-bold mt-1">{t.avgIntensity ?? '–'}<span className="text-base text-slate-400">/5</span></div><Delta v={delta(t.avgIntensity, t.previousAvgIntensity)} /></Card>
        <Card className="!p-4"><div className="text-xs text-slate-500">Calm days</div><div className="text-3xl font-bold mt-1">{t.calmDays}<span className="text-base text-slate-400"> / {d.rangeDays}</span></div></Card>
        <Card className="!p-4"><div className="text-xs text-slate-500">Longest calm streak</div><div className="text-3xl font-bold mt-1">{t.longestCalmStreak}<span className="text-base text-slate-400"> days</span></div></Card>
      </div>

      {tips.length > 0 && (
        <Card className="!bg-indigo-50 !border-indigo-100 space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-800"><Lightbulb className="w-4 h-4" /> What stands out for {name}</div>
          <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">{tips.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </Card>
      )}

      <Card><h3 className="font-bold mb-3">Day by day</h3><Calendar daily={d.daily} days={d.rangeDays} /></Card>

      <Card>
        <h3 className="font-bold mb-1">When episodes happen</h3>
        <p className="text-xs text-slate-500 mb-3">Darker means more episodes.</p>
        <div className="overflow-x-auto"><table className="text-xs w-full min-w-[420px] border-separate border-spacing-1">
          <thead><tr><th />{g.parts.map((p: string) => <th key={p} className="font-normal text-slate-500 pb-1">{p}</th>)}</tr></thead>
          <tbody>{[1, 2, 3, 4, 5, 6, 0].map((r) => <tr key={r}><th className="font-normal text-slate-500 text-right pr-2">{g.weekdays[r]}</th>{g.grid[r].map((n: number, c: number) => <td key={c} title={`${g.weekdays[r]} ${g.parts[c]}: ${n}`} className="h-8 rounded-md text-center font-bold" style={{ background: heat(n, gMax), color: n / gMax > 0.5 ? '#fff' : '#3B4843' }}>{n || ''}</td>)}</tr>)}</tbody>
        </table></div>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">Triggers and what helped</h3>
        {d.triggers.length === 0 ? <p className="text-sm text-slate-500">No episodes in this period.</p> : (
          <div className="divide-y divide-slate-100">{d.triggers.map((x: any) => (
            <div key={x.name} className="py-3 first:pt-0 last:pb-0">
              <div className="flex justify-between gap-3 text-sm"><span className="font-bold">{x.name}</span><span className="text-slate-500 shrink-0">{x.count}× · avg {x.avgIntensity}/5</span></div>
              <div className="mt-1.5"><Bar percent={(x.count / d.triggers[0].count) * 100} color="bg-rose-400" label={x.name} /></div>
              <div className="text-xs text-slate-500 mt-1.5">{x.bestStrategy ? <>Quickest recovery with <b className="text-slate-700">{x.bestStrategy.name}</b> (about {x.bestStrategy.avgRecovery} min)</> : 'No recovery data to compare yet'}</div>
            </div>))}</div>)}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="font-bold mb-3">Calming strategies, fastest recovery first</h3>
          {d.strategies.length === 0 ? <p className="text-sm text-slate-500">Log what helped to compare strategies.</p> : <div className="space-y-3">{d.strategies.map((s: any) => <div key={s.name}><div className="flex justify-between text-sm"><span>{s.name}</span><span className="text-slate-500">{s.avgRecovery ?? '–'} min · used {s.used}×</span></div><div className="mt-1"><Bar percent={s.avgRecovery ? Math.max(8, 100 - (s.avgRecovery / Math.max(...d.strategies.map((x: any) => x.avgRecovery || 1))) * 85) : 0} color="bg-emerald-500" label={s.name} /></div></div>)}</div>}
          <p className="text-[11px] text-slate-400 mt-3">Longer bar = quicker recovery. Small samples can mislead.</p>
        </Card>
        <Card>
          <h3 className="font-bold mb-3">Behaviors and places</h3>
          {[['Behaviors', d.behaviors], ['Places', d.locations]].map(([title, rows]: any) => (
            <div key={title} className="mb-4 last:mb-0"><div className="text-xs font-bold text-slate-500 mb-2">{title}</div>
              <div className="flex flex-wrap gap-1.5">{rows.length ? rows.map((r: any) => <span key={r.name} className="px-2.5 py-1 rounded-full bg-slate-100 text-sm">{r.name} <b className="text-slate-500">{r.count}</b></span>) : <span className="text-sm text-slate-400">None yet</span>}</div></div>))}
        </Card>
      </div>
    </div>
  );
}
