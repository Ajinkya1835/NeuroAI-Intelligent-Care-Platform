'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, AlertTriangle, Calendar, Activity, Award, Users,
  Plus, ShieldAlert, Sparkles, X, Send, RefreshCw, WifiOff
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'logger', label: 'Episodes', icon: AlertTriangle },
  { id: 'routines', label: 'Routines', icon: Calendar },
  { id: 'insights', label: 'Patterns', icon: Activity },
  { id: 'activities', label: 'Activities', icon: Award },
  { id: 'therapist', label: 'Therapist', icon: Users },
];

const BEHAVIORS = ['Covering ears', 'Crying', 'Screaming', 'Hitting', 'Running away', 'Shutting down', 'Rocking'];
const CALMING = ['Weighted Blanket', 'Noise Canceling Headphones', 'Deep Breathing', 'Quiet Room', 'Favorite Toy', 'Deep Pressure Hug'];
const CHAT_PRESETS = ['Top triggers?', 'When do episodes happen?', 'Latest episode?', 'Pending routines?', 'Therapist notes?', 'How do I log an episode?'];

const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
};
const post = (path: string, body: any, method = 'POST') =>
  api(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const fmt = (d: string) =>
  new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const emptyLog = {
  location: 'Home', activity: '', trigger: '', sensoryEnvironment: 'Normal',
  sleepHours: 8, hungerLevel: 'Normal', behaviors: [] as string[], intensity: 3,
  durationMinutes: 10, response: '', recoveryMinutes: 10,
  calmingInterventions: [] as string[], postEpisodeBehavior: ''
};

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o} type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function NeuroAIDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error' | 'empty'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [toast, setToast] = useState('');

  const [child, setChild] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any>({ avgIntensity: 0, totalEpisodes: 0, triggerCounts: [], locationCounts: [], routineSuccessRate: 0 });
  const [routines, setRoutines] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [team, setTeam] = useState<any>({ parent: null, therapists: [] });
  const [insight, setInsight] = useState<{ text: string; source: string } | null>(null);

  const [logOpen, setLogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [log, setLog] = useState(emptyLog);
  const [saving, setSaving] = useState(false);

  const [sosOpen, setSosOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<{ sender: string; text: string }[]>([
    { sender: 'ai', text: "Hi! Ask me about Alex's episodes, triggers, routines or how to use the app." },
  ]);
  const [chatInput, setChatInput] = useState('');

  const [noteText, setNoteText] = useState('');
  const [noteAs, setNoteAs] = useState<'Parent' | 'Therapist'>('Parent');

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    try {
      const kids = await api('/api/children');
      if (!kids.length) { setStatus('empty'); return; }
      const c = kids[0];
      setChild(c);
      const id = c._id;
      const [t, e, p, r, a, n, tm] = await Promise.all([
        api(`/api/children/${id}/timeline`),
        api(`/api/children/${id}/episodes`),
        api(`/api/children/${id}/patterns`),
        api(`/api/children/${id}/routines`),
        api('/api/activities'),
        api(`/api/children/${id}/notes`),
        api(`/api/children/${id}/team`),
      ]);
      setTimeline(t); setEpisodes(e); setPatterns(p); setRoutines(r);
      setActivities(a); setNotes(n); setTeam(tm);
      setStatus('ok');
      if (!silent) {
        post('/api/ai/analyze', { childId: id })
          .then((d) => setInsight({ text: d.analysis, source: d.source }))
          .catch(() => {});
      }
    } catch (err: any) {
      setErrMsg(err.message || 'Failed to fetch');
      if (!silent) setStatus('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [load]);

  const saveEpisode = async () => {
    if (!child) return;
    setSaving(true);
    try {
      await post('/api/episodes', { ...log, childId: child._id, ts: new Date().toISOString() });
      setLogOpen(false); setStep(1); setLog(emptyLog);
      say('Episode saved');
      load();
    } catch { say('Could not save. Is the backend running?'); }
    setSaving(false);
  };

  const toggleRoutine = async (id: string, completed: boolean) => {
    setRoutines((p) => p.map((r) => (r._id === id ? { ...r, completed } : r)));
    try { await post(`/api/routines/${id}`, { completed }, 'PATCH'); load(true); }
    catch { say('Could not update routine'); load(true); }
  };

  const feedback = async (activityId: string, rating: string) => {
    try { await post(`/api/activities/${activityId}/feedback`, { childId: child._id, rating }); say(`Saved: ${rating}`); }
    catch { say('Could not save feedback'); }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    try {
      await post(`/api/children/${child._id}/notes`, {
        author: noteAs === 'Therapist' ? (team.therapists[0]?.name || 'Therapist') : (team.parent?.name || 'Parent'),
        authorRole: noteAs,
        text: noteText.trim(),
      });
      setNoteText(''); say('Note added'); load(true);
    } catch { say('Could not add note'); }
  };

  const sendChat = async (preset?: string) => {
    const msg = (preset ?? chatInput).trim();
    if (!msg || !child) return;
    setChat((p) => [...p, { sender: 'user', text: msg }, { sender: 'ai', text: 'Thinking…' }]);
    setChatInput('');
    try {
      const d = await post('/api/ai/chat', { message: msg, childId: child._id });
      const text = d.source === 'rule-based' ? `${d.reply}\n\n(Answered from your records, AI model offline)` : d.reply;
      setChat((p) => [...p.slice(0, -1), { sender: 'ai', text }]);
    } catch {
      setChat((p) => [...p.slice(0, -1), { sender: 'ai', text: 'Cannot reach the backend. Is it running?' }]);
    }
  };

  const maxTrig = Math.max(1, ...patterns.triggerCounts.map((t: any) => t.count));
  const maxLoc = Math.max(1, ...patterns.locationCounts.map((t: any) => t.count));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">🧠</div>
            <div>
              <div className="font-bold leading-tight">NeuroAI</div>
              <div className="text-xs text-slate-500 leading-tight">
                {child ? `${child.name}, ${child.age} yrs` : 'Care Suite'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => load()} title="Refresh" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setLogOpen(true)} disabled={!child}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Log episode
            </button>
            <button onClick={() => setSosOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> SOS
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-56 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-61px)] p-3 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-6 pb-24 lg:pb-6 max-w-5xl">
          {status === 'error' && (
            <Card className="mb-4 border-rose-200 bg-rose-50">
              <div className="flex items-start gap-3">
                <WifiOff className="w-5 h-5 text-rose-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-rose-800">Can&apos;t reach the backend</div>
                  <div className="text-rose-700 mt-1">
                    Tried <code className="bg-white px-1 rounded">{API}</code> ({errMsg}). Check that the backend is running
                    (<code className="bg-white px-1 rounded">node --env-file=.env server.js</code>), MongoDB is up,
                    and CORS_ORIGIN matches this page&apos;s address.
                  </div>
                  <button onClick={() => load()} className="mt-2 text-rose-800 underline font-medium">Retry</button>
                </div>
              </div>
            </Card>
          )}
          {status === 'empty' && (
            <Card className="mb-4 border-amber-200 bg-amber-50 text-sm text-amber-800">
              Backend is connected but the database is empty. Run <code className="bg-white px-1 rounded">node --env-file=.env seed.js</code> in neuroai-backend, then refresh.
            </Card>
          )}
          {status === 'loading' && !child && <p className="text-sm text-slate-500">Loading…</p>}

          {/* DASHBOARD */}
          {child && tab === 'dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { l: 'Avg intensity', v: `${patterns.avgIntensity}/5` },
                  { l: 'Episodes logged', v: patterns.totalEpisodes },
                  { l: 'Top trigger', v: patterns.triggerCounts[0]?.name || '—', small: true },
                  { l: 'Routines done', v: `${patterns.routineSuccessRate}%` },
                ].map((s) => (
                  <Card key={s.l} className="!p-4">
                    <div className="text-xs text-slate-500">{s.l}</div>
                    <div className={`font-bold mt-1 ${s.small ? 'text-base truncate' : 'text-2xl'}`}>{s.v}</div>
                  </Card>
                ))}
              </div>

              <Card>
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                  <Sparkles className="w-4 h-4" /> Pattern insight
                  {insight && (
                    <span className="ml-auto text-xs font-normal text-slate-400">
                      {insight.source === 'ollama' ? 'AI generated' : 'Stats summary'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{insight ? insight.text : 'Analyzing recent episodes…'}</p>
              </Card>

              <Card>
                <h3 className="font-semibold mb-3">Recent activity</h3>
                {timeline.length === 0 ? (
                  <p className="text-sm text-slate-400">Nothing logged yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {timeline.slice(0, 8).map((e, i) => (
                      <li key={i} className="py-3 flex gap-3">
                        <span className={`shrink-0 mt-0.5 h-fit text-[10px] font-bold px-2 py-1 rounded ${
                          e.type === 'episode' ? 'bg-rose-100 text-rose-700' :
                          e.type === 'note' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                          {e.type.toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2">
                            <span className="text-sm font-medium truncate">{e.title}</span>
                            <span className="text-xs text-slate-400 shrink-0">{fmt(e.ts)}</span>
                          </div>
                          {e.details && <p className="text-sm text-slate-500 mt-0.5">{e.details}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {/* EPISODES */}
          {child && tab === 'logger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Episodes</h2>
                <button onClick={() => setLogOpen(true)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium">+ New episode</button>
              </div>
              {episodes.length === 0 ? <Card><p className="text-sm text-slate-400">No episodes yet.</p></Card> :
                episodes.map((e) => (
                  <Card key={e._id} className="!p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{e.trigger || 'Unknown trigger'}</div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        e.intensity >= 4 ? 'bg-rose-100 text-rose-700' : e.intensity === 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        Intensity {e.intensity}/5
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {fmt(e.ts)} · {[e.location, e.activity].filter(Boolean).join(' · ')}
                      {e.durationMinutes ? ` · ${e.durationMinutes} min` : ''}
                    </div>
                    {(e.behaviors?.length > 0 || e.calmingInterventions?.length > 0) && (
                      <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                        {e.behaviors?.length > 0 && <div><b>Behaviors:</b> {e.behaviors.join(', ')}</div>}
                        {e.calmingInterventions?.length > 0 && <div><b>What helped:</b> {e.calmingInterventions.join(', ')}</div>}
                      </div>
                    )}
                  </Card>
                ))}
            </div>
          )}

          {/* ROUTINES */}
          {child && tab === 'routines' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Routines</h2>
              <Card className="!p-2">
                {routines.length === 0 ? <p className="text-sm text-slate-400 p-3">No routines yet.</p> :
                  routines.map((r) => (
                    <label key={r._id} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <span className="flex items-center gap-3">
                        <input type="checkbox" checked={!!r.completed}
                          onChange={(e) => toggleRoutine(r._id, e.target.checked)}
                          className="w-5 h-5 accent-indigo-600" />
                        <span className={`text-sm ${r.completed ? 'line-through text-slate-400' : ''}`}>{r.title}</span>
                      </span>
                      <span className="text-xs text-slate-500">{r.scheduleTime || r.category}</span>
                    </label>
                  ))}
              </Card>
            </div>
          )}

          {/* PATTERNS */}
          {child && tab === 'insights' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Patterns</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Triggers', data: patterns.triggerCounts, max: maxTrig, color: 'bg-rose-400' },
                  { title: 'Locations', data: patterns.locationCounts, max: maxLoc, color: 'bg-indigo-400' },
                ].map((g) => (
                  <Card key={g.title}>
                    <h3 className="font-semibold mb-3">{g.title}</h3>
                    {g.data.length === 0 ? <p className="text-sm text-slate-400">No data yet.</p> :
                      <div className="space-y-3">
                        {g.data.map((d: any) => (
                          <div key={d.name}>
                            <div className="flex justify-between text-sm mb-1"><span>{d.name}</span><span className="text-slate-500">{d.count}</span></div>
                            <div className="h-2 bg-slate-100 rounded-full">
                              <div className={`h-2 rounded-full ${g.color}`} style={{ width: `${(d.count / g.max) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITIES */}
          {child && tab === 'activities' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Suggested activities</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {activities.map((a) => (
                  <Card key={a._id} className="flex flex-col justify-between">
                    <div>
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{a.category}</span>
                      <h3 className="font-semibold mt-2">{a.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{a.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button onClick={() => feedback(a._id, 'Completed')} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium py-2 rounded-lg">Completed</button>
                      <button onClick={() => feedback(a._id, 'Too Difficult')} className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium py-2 rounded-lg">Too hard</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* THERAPIST */}
          {child && tab === 'therapist' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Care team</h2>
              <Card>
                <h3 className="font-semibold mb-3 text-sm">People with access</h3>
                <ul className="space-y-2">
                  {team.parent && (
                    <li className="flex items-center justify-between text-sm">
                      <span>{team.parent.name} <span className="text-slate-400">· Parent</span></span>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">Owner</span>
                    </li>
                  )}
                  {team.therapists.map((t: any) => (
                    <li key={t._id} className="flex items-center justify-between text-sm">
                      <span>{t.name} <span className="text-slate-400">· Therapist</span></span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Access granted</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <h3 className="font-semibold mb-3 text-sm">Shared notes</h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <select value={noteAs} onChange={(e) => setNoteAs(e.target.value as any)} className={`${inputCls} sm:w-36`}>
                    <option>Parent</option><option>Therapist</option>
                  </select>
                  <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    placeholder="Write a note…" className={inputCls} />
                  <button onClick={addNote} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
                </div>
                {notes.length === 0 ? <p className="text-sm text-slate-400">No notes yet.</p> :
                  <ul className="divide-y divide-slate-100">
                    {notes.map((n) => (
                      <li key={n._id} className="py-3">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{n.author}{n.authorRole ? ` · ${n.authorRole}` : ''}</span><span>{fmt(n.ts)}</span>
                        </div>
                        <p className="text-sm mt-1">{n.text}</p>
                      </li>
                    ))}
                  </ul>}
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Bottom tabs (mobile) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-2 flex flex-col items-center text-[10px] ${tab === id ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Icon className="w-5 h-5" />{label}
          </button>
        ))}
      </nav>

      {/* Chat */}
      <button onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-20 lg:bottom-6 right-4 bg-indigo-600 text-white p-3.5 rounded-full shadow-lg z-40">
        <Sparkles className="w-5 h-5" />
      </button>
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
          <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
            <span className="font-semibold">Assistant</span>
            <button onClick={() => setChatOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : ''}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="px-3 pb-2 flex flex-wrap gap-2">
            {CHAT_PRESETS.map((q) => (
              <button key={q} onClick={() => sendChat(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                {q}
              </button>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Ask something…" className={inputCls} />
            <button onClick={() => sendChat()} className="bg-indigo-600 text-white px-3 rounded-lg"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Log wizard */}
      {logOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Log episode · Step {step} of 3</h3>
              <button onClick={() => setLogOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-indigo-600">Before: context and trigger</p>
                <Field label="Location"><input className={inputCls} value={log.location} onChange={(e) => setLog({ ...log, location: e.target.value })} /></Field>
                <Field label="What was happening?"><input className={inputCls} value={log.activity} placeholder="e.g. Lunch time" onChange={(e) => setLog({ ...log, activity: e.target.value })} /></Field>
                <Field label="Trigger"><input className={inputCls} value={log.trigger} placeholder="e.g. Loud noise" onChange={(e) => setLog({ ...log, trigger: e.target.value })} /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Environment">
                    <select className={inputCls} value={log.sensoryEnvironment} onChange={(e) => setLog({ ...log, sensoryEnvironment: e.target.value })}>
                      <option>Quiet</option><option>Normal</option><option>Loud</option><option>Crowded</option>
                    </select>
                  </Field>
                  <Field label="Sleep (hrs)"><input type="number" className={inputCls} value={log.sleepHours} onChange={(e) => setLog({ ...log, sleepHours: Number(e.target.value) })} /></Field>
                  <Field label="Hunger">
                    <select className={inputCls} value={log.hungerLevel} onChange={(e) => setLog({ ...log, hungerLevel: e.target.value })}>
                      <option>Full</option><option>Normal</option><option>Hungry</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-rose-600">During: behaviors and intensity</p>
                <Field label="Behaviors"><Chips options={BEHAVIORS} value={log.behaviors} onChange={(v) => setLog({ ...log, behaviors: v })} /></Field>
                <Field label={`Intensity: ${log.intensity}/5`}>
                  <input type="range" min={1} max={5} value={log.intensity} onChange={(e) => setLog({ ...log, intensity: Number(e.target.value) })} className="w-full accent-rose-600" />
                </Field>
                <Field label="Duration (min)"><input type="number" className={inputCls} value={log.durationMinutes} onChange={(e) => setLog({ ...log, durationMinutes: Number(e.target.value) })} /></Field>
                <Field label="How did you respond?"><input className={inputCls} value={log.response} placeholder="e.g. Moved to a quiet room" onChange={(e) => setLog({ ...log, response: e.target.value })} /></Field>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-emerald-600">After: what helped</p>
                <Field label="What helped"><Chips options={CALMING} value={log.calmingInterventions} onChange={(v) => setLog({ ...log, calmingInterventions: v })} /></Field>
                <Field label="Recovery time (min)"><input type="number" className={inputCls} value={log.recoveryMinutes} onChange={(e) => setLog({ ...log, recoveryMinutes: Number(e.target.value) })} /></Field>
                <Field label="Behavior afterwards"><input className={inputCls} value={log.postEpisodeBehavior} placeholder="e.g. Calm but tired" onChange={(e) => setLog({ ...log, postEpisodeBehavior: e.target.value })} /></Field>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t">
              {step > 1 ? <button onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded-lg text-sm">Back</button> : <span />}
              {step < 3
                ? <button onClick={() => setStep(step + 1)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium">Next</button>
                : <button onClick={saveEpisode} disabled={saving} className="bg-emerald-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">{saving ? 'Saving…' : 'Save episode'}</button>}
            </div>
          </div>
        </div>
      )}

      {/* SOS */}
      {sosOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4 border-2 border-rose-500">
            <div className="flex justify-between items-center text-rose-600">
              <h3 className="font-bold text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> De-escalation steps</h3>
              <button onClick={() => setSosOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <ol className="text-sm text-slate-700 space-y-2 list-decimal pl-5">
              <li>Reduce stimulation: dim lights, cut background noise.</li>
              <li>Offer deep pressure: weighted blanket or a firm hug if welcome.</li>
              <li>Use few, calm words. Don&apos;t ask for answers yet.</li>
              <li>Stay close and wait. Let the child recover at their own pace.</li>
            </ol>
            <a href="tel:112" className="block text-center bg-rose-600 text-white py-3 rounded-lg font-semibold">Call emergency (112)</a>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg z-[60]">{toast}</div>
      )}
    </div>
  );
}