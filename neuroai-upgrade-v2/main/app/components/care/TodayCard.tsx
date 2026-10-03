'use client';
import React, { useEffect, useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Card, Bar } from '../learning/ui';
import { call, send } from './api';

// Dashboard card: today's routines, tickable in place.
export default function TodayCard({ childId, onOpen, version, readOnly = false }: { childId: string; onOpen: () => void; version?: number; readOnly?: boolean }) {
  const [d, setD] = useState<any>(null);
  const load = () => call(`/api/children/${childId}/routines/week`).then(setD).catch(() => {});
  useEffect(() => { load(); }, [childId, version]); // eslint-disable-line
  if (!d) return null;
  const due = d.items.filter((i: any) => i.active && i.scheduledToday);
  if (!due.length) return null;
  const tick = async (r: any) => { await send(`/api/routines/${r._id}/log`, { status: r.todayStatus === 'completed' ? 'pending' : 'completed' }).catch(() => {}); load(); };
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between"><h3 className="font-bold">Today&apos;s routines</h3><span className="text-sm font-bold text-indigo-700">{d.today.done}/{d.today.total}</span></div>
      <Bar percent={(d.today.done / d.today.total) * 100} color="bg-emerald-500" label="Today's routines" />
      <ul className="divide-y divide-slate-100">{due.slice(0, 5).map((r: any) => (
        <li key={r._id} className="py-2 flex items-center gap-3">
          <button disabled={readOnly} onClick={() => tick(r)} aria-label={`${r.todayStatus === 'completed' ? 'Undo' : 'Mark done'}: ${r.title}`} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${r.todayStatus === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:text-indigo-300 disabled:opacity-50 disabled:hover:text-transparent'}`}><Check className="w-4 h-4" /></button>
          <span className={`flex-1 text-sm ${r.todayStatus === 'completed' ? 'line-through text-slate-400' : ''}`}>{r.title}</span>
          <span className="text-xs text-slate-400">{r.scheduleTime}</span>
        </li>))}</ul>
      <button onClick={onOpen} className="text-sm font-medium text-indigo-700 flex items-center gap-1">All routines <ArrowRight className="w-4 h-4" /></button>
    </Card>
  );
}
