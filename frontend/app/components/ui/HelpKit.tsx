'use client';
import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, X, ArrowRight, ArrowLeft, Lightbulb, CheckCircle2 } from 'lucide-react';
import { HELP, TOUR } from './help';

/** Small "i" bubble that explains a single term or field. */
export function HelpTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button type="button" aria-label="More info" aria-expanded={open} onClick={() => setOpen(!open)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="text-slate-400 hover:text-indigo-600 transition"><HelpCircle className="w-4 h-4" /></button>
      {open && (
        <span role="tooltip" className="pop-in absolute z-50 left-1/2 -translate-x-1/2 top-6 w-56 rounded-xl bg-slate-900 text-white text-xs leading-relaxed p-3 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

/** Right-hand "About this page" drawer. */
export function HelpDrawer({ tab, open, onClose }: { tab: string; open: boolean; onClose: () => void }) {
  const h = HELP[tab] || HELP.dashboard;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55]">
      <div className="fade-in absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside role="dialog" aria-label={`About ${h.title}`} className="slide-in absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-indigo-600">About this page</div>
            <h2 className="text-xl font-bold mt-1">{h.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto text-sm">
          <p className="text-base text-slate-700">{h.what}</p>
          <div>
            <div className="font-semibold mb-2">How to use it</div>
            <ol className="space-y-2">
              {h.steps.map((s, i) => (
                <li key={i} className="flex gap-3"><span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{i + 1}</span><span className="pt-0.5">{s}</span></li>
              ))}
            </ol>
          </div>
          {h.tip && <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900"><Lightbulb className="w-5 h-5 shrink-0" /><span>{h.tip}</span></div>}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <div className="font-semibold">Need urgent help?</div>
            <p className="text-slate-600 mt-1">Use the red <b>SOS</b> button at the top for calming steps and emergency contacts. In an emergency call your local emergency number.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** Page title row with a built-in "?" button. */
export function PageTitle({ tab, onHelp }: { tab: string; onHelp: () => void }) {
  const h = HELP[tab]; if (!h) return null;
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div><h1 className="text-2xl font-bold">{h.title}</h1><p className="text-sm text-slate-500 mt-0.5 max-w-xl">{h.what}</p></div>
      <button onClick={onHelp} className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full px-3 py-1.5">
        <HelpCircle className="w-4 h-4" /> Help
      </button>
    </div>
  );
}

/** First-visit welcome tour. Shown once, can be reopened from the menu. */
export function WelcomeTour({ forceOpen, onDone }: { forceOpen: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    try { if (!localStorage.getItem('neuroai_tour_done')) setOpen(true); } catch { setOpen(true); }
  }, []);
  useEffect(() => { if (forceOpen) { setI(0); setOpen(true); } }, [forceOpen]);
  if (!open) return null;
  const s = TOUR[i], last = i === TOUR.length - 1;
  const finish = () => { try { localStorage.setItem('neuroai_tour_done', '1'); } catch {} setOpen(false); onDone(); };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fade-in absolute inset-0 bg-slate-900/50" />
      <div role="dialog" aria-modal="true" aria-label="Welcome tour" className="pop-in relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 text-center">
        <button onClick={finish} className="absolute top-4 right-4 text-xs text-slate-400 hover:text-slate-600">Skip</button>
        <div className="text-5xl mb-4" aria-hidden>{s.emoji}</div>
        <h2 className="text-xl font-bold">{s.title}</h2>
        <p className="text-slate-600 mt-2">{s.body}</p>
        <div className="flex justify-center gap-1.5 my-6" aria-hidden>
          {TOUR.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200'}`} />)}
        </div>
        <div className="flex gap-2">
          {i > 0 && <button onClick={() => setI(i - 1)} className="px-4 py-2.5 rounded-xl border border-slate-200 font-medium flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Back</button>}
          <button onClick={() => (last ? finish() : setI(i + 1))} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5">
            {last ? <><CheckCircle2 className="w-4 h-4" />Get started</> : <>Next<ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
