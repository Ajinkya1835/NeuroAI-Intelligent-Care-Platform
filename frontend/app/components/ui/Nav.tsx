'use client';
import React, { useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';

export type NavTab = { id: string; label: string; icon: React.ElementType };
const GROUPS: { label: string; ids: string[] }[] = [
  { label: 'Home', ids: ['dashboard', 'clinic'] },
  { label: 'Daily care', ids: ['logger', 'routines', 'activities'] },
  { label: 'Understand', ids: ['insights', 'ai'] },
  { label: 'Grow', ids: ['learn', 'teach'] },
  { label: 'People', ids: ['profile', 'therapist'] },
];
const PRIMARY = ['dashboard', 'logger', 'routines', 'insights'];

export function Sidebar({ tabs, tab, setTab, onTour }: { tabs: NavTab[]; tab: string; setTab: (t: string) => void; onTour: () => void }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-61px)] p-4">
      <nav aria-label="Main" className="space-y-5 flex-1">
        {GROUPS.map((g) => {
          const items = tabs.filter((t) => g.ids.includes(t.id));
          if (!items.length) return null;
          return (
            <div key={g.label}>
              <div className="px-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.label}</div>
              {items.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${tab === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Icon className="w-[18px] h-[18px]" /> {label}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
      <button onClick={onTour} className="mt-4 text-left text-xs text-slate-500 hover:text-indigo-700 rounded-xl bg-slate-50 p-3">
        <b className="block text-slate-700 text-sm">New here?</b>Take a 30-second tour →
      </button>
    </aside>
  );
}

export function MobileNav({ tabs, tab, setTab }: { tabs: NavTab[]; tab: string; setTab: (t: string) => void }) {
  const [more, setMore] = useState(false);
  const primary = tabs.filter((t) => PRIMARY.includes(t.id));
  const rest = tabs.filter((t) => !PRIMARY.includes(t.id));
  const go = (id: string) => { setTab(id); setMore(false); };
  return (
    <>
      {more && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fade-in absolute inset-0 bg-slate-900/40" onClick={() => setMore(false)} />
          <div className="sheet-up absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 pb-24">
            <div className="flex justify-between items-center mb-3"><b>More</b><button onClick={() => setMore(false)} aria-label="Close"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-3 gap-3">
              {rest.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => go(id)} className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-xs font-medium ${tab === id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                  <Icon className="w-6 h-6" />{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav aria-label="Main" className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 z-50 flex pb-[env(safe-area-inset-bottom)]">
        {[...primary, { id: '__more', label: 'More', icon: MoreHorizontal }].map(({ id, label, icon: Icon }) => {
          const active = id === '__more' ? rest.some((r) => r.id === tab) : tab === id;
          return (
            <button key={id} onClick={() => (id === '__more' ? setMore(!more) : go(id))}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[11px] font-medium ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
              <Icon className="w-5 h-5" />{label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
