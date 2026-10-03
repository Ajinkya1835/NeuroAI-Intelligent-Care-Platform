'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Phone, Mail, CheckCircle2, XCircle, Circle, TrendingDown, TrendingUp, Minus, Sparkles, AlertTriangle, ThumbsUp, Info } from 'lucide-react';
import { authFetch, getSession } from '../../lib/auth';
import { Card, Bar } from '../learning/ui';

// One synced snapshot from GET /api/children/:id/profile. Re-fetched every 30s and on demand, so
// anything logged elsewhere in the app (episodes, routines, notes, worksheets) appears here.
type P = any;
const TABS = ['Overview', 'Episodes', 'Routines', 'Goals & progress', 'AI insights', 'Notes & team'] as const;
type TabName = (typeof TABS)[number];
const day = (d: string) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
const when = (d: string) => new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const val = (v: any, suffix = '') => (v === null || v === undefined ? '–' : `${v}${suffix}`);

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="!p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </Card>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-sm mb-3">{children}</h3>;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}

// ---------- tiny SVG charts (no dependencies) ----------
function LineChart({ points, max = 5, color = '#4f46e5', height = 140 }: { points: { label: string; value: number }[]; max?: number; color?: string; height?: number }) {
  if (points.length < 2) return <Empty text="Not enough data for a chart yet." />;
  const W = 400, pad = 24, H = height;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (points.length - 1);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Trend chart">
      {[0, max / 2, max].map((g) => (
        <g key={g}>
          <line x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="#e2e8f0" />
          <text x={4} y={y(g) + 3} fontSize="9" fill="#94a3b8">{g}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="3.5" fill={color}><title>{`${p.label}: ${p.value}`}</title></circle>
          {(i === 0 || i === points.length - 1 || points.length <= 6) && (
            <text x={x(i)} y={H - 6} fontSize="9" fill="#64748b" textAnchor="middle">{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

function HBars({ rows, color = 'bg-indigo-500', suffix = '' }: { rows: { name: string; value: number; note?: string }[]; color?: string; suffix?: string }) {
  if (!rows.length) return <Empty text="No data yet." />;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.name}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-700">{r.name}</span>
            <span className="text-slate-500">{r.value}{suffix}{r.note ? ` · ${r.note}` : ''}</span>
          </div>
          <Bar percent={(r.value / max) * 100} color={color} label={r.name} />
        </div>
      ))}
    </div>
  );
}

function HourChart({ hourly }: { hourly: { hour: number; count: number }[] }) {
  if (!hourly.length) return <Empty text="No data yet." />;
  const max = Math.max(1, ...hourly.map((h) => h.count));
  const by = Object.fromEntries(hourly.map((h) => [h.hour, h.count]));
  return (
    <div>
      <div className="flex items-end gap-0.5 h-24">
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} title={`${h}:00 · ${by[h] || 0} episodes`} className="flex-1 bg-indigo-100 rounded-t relative" style={{ height: '100%' }}>
            <div className="absolute bottom-0 inset-x-0 bg-indigo-500 rounded-t" style={{ height: `${((by[h] || 0) / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span></div>
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const W = 80, H = 24, max = Math.max(...values, 100), min = Math.min(...values, 0);
  const pts = values.map((v, i) => `${(i * W) / (values.length - 1)},${H - ((v - min) / (max - min || 1)) * H}`).join(' ');
  return <svg width={W} height={H} aria-hidden><polyline points={pts} fill="none" stroke="#10b981" strokeWidth="2" /></svg>;
}

const dot: Record<string, string> = { completed: 'text-emerald-500', skipped: 'text-rose-400', pending: 'text-slate-300', none: 'text-slate-200' };

// ---------- sections ----------
function Overview({ p }: { p: P }) {
  const s = p.episodes.stats;
  const TrendIcon = s.trend === 'improving' ? TrendingDown : s.trend === 'worsening' ? TrendingUp : Minus;
  const trendColor = s.trend === 'improving' ? 'text-emerald-600' : s.trend === 'worsening' ? 'text-rose-600' : 'text-slate-500';
  const goalPct = p.goals.length ? Math.round(p.goals.reduce((a: number, g: any) => a + (g.percentOfTarget || 0), 0) / p.goals.length) : null;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={`Episodes (${p.rangeDays}d)`} value={s.total || 0} hint={s.daysSinceLast !== undefined ? `last one ${s.daysSinceLast}d ago` : undefined} />
        <Stat label="Avg intensity" value={val(s.avgIntensity, '/5')} hint={s.trend ? `${s.firstHalfAvgIntensity} → ${s.recentAvgIntensity}` : undefined} />
        <Stat label="Routine adherence" value={val(p.routines.overallAdherencePct, '%')} hint="last 7 days" />
        <Stat label="Goal progress" value={val(goalPct, '%')} hint={`${p.goals.length} goals`} />
      </div>
      {s.trend && (
        <Card className="flex items-center gap-3">
          <TrendIcon className={`w-6 h-6 ${trendColor}`} />
          <div className="text-sm">
            <span className={`font-semibold capitalize ${trendColor}`}>{s.trend}</span>
            <span className="text-slate-600"> · average intensity moved from {s.firstHalfAvgIntensity} to {s.recentAvgIntensity}; episodes last {val(s.avgDuration, ' min')} on average.</span>
          </div>
        </Card>
      )}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card><Title>Intensity by week</Title><LineChart points={p.episodes.weekly.map((w: any) => ({ label: day(w.week), value: w.avgIntensity }))} /></Card>
        <Card><Title>Top triggers</Title><HBars rows={p.episodes.breakdowns.triggers.map((t: any) => ({ name: t.name, value: t.count, note: `avg ${t.avgIntensity}/5` }))} /></Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <Title>About {p.child.name}</Title>
          <p className="text-sm text-slate-600">{p.child.notes || 'No notes yet.'}</p>
          <div className="mt-3 text-xs text-slate-500">Interests</div>
          <div className="flex flex-wrap gap-1.5 mt-1">{p.child.interests.map((i: string) => <span key={i} className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">{i}</span>)}</div>
          <div className="mt-3 text-xs text-slate-500">Calming strategies</div>
          <div className="flex flex-wrap gap-1.5 mt-1">{p.child.calmingStrategies.map((i: string) => <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">{i}</span>)}</div>
        </Card>
        <Card>
          <Title>Recent milestones</Title>
          {p.progress.milestones.length ? (
            <ul className="space-y-2 text-sm">{p.progress.milestones.slice(0, 5).map((m: any) => <li key={m._id} className="flex justify-between gap-3"><span>🏅 {m.title}</span><span className="text-xs text-slate-400 shrink-0">{day(m.ts)}</span></li>)}</ul>
          ) : <Empty text="No milestones yet." />}
        </Card>
      </div>
    </div>
  );
}

function Episodes({ p }: { p: P }) {
  const b = p.episodes.breakdowns;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Avg duration" value={val(p.episodes.stats.avgDuration, ' min')} />
        <Stat label="Avg recovery" value={val(p.episodes.stats.avgRecovery, ' min')} />
        <Stat label="All-time episodes" value={p.episodes.allTimeTotal} />
        <Stat label="Trend" value={<span className="capitalize text-lg">{p.episodes.stats.trend || '–'}</span>} />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card><Title>Episodes per week</Title><LineChart max={Math.max(3, ...p.episodes.weekly.map((w: any) => w.episodes))} color="#e11d48" points={p.episodes.weekly.map((w: any) => ({ label: day(w.week), value: w.episodes }))} /></Card>
        <Card><Title>Time of day</Title><HourChart hourly={b.hourly} /></Card>
        <Card><Title>Locations</Title><HBars color="bg-sky-500" rows={b.locations.map((x: any) => ({ name: x.name, value: x.count }))} /></Card>
        <Card><Title>Behaviors seen</Title><HBars color="bg-amber-500" rows={b.behaviors.map((x: any) => ({ name: x.name, value: x.count }))} /></Card>
        <Card><Title>Sleep and hunger vs intensity</Title>
          <HBars color="bg-violet-500" suffix="/5" rows={[...b.bySleep.map((x: any) => ({ name: `Sleep ${x.name}`, value: x.avgIntensity, note: `${x.count} ep.` })), ...b.byHunger.map((x: any) => ({ name: `Hunger: ${x.name}`, value: x.avgIntensity, note: `${x.count} ep.` }))]} />
        </Card>
        <Card><Title>Calming strategies used</Title>
          <HBars color="bg-emerald-500" rows={p.episodes.strategies.map((x: any) => ({ name: x.name, value: x.timesUsed, note: x.avgRecoveryMinutes != null ? `recovery ${x.avgRecoveryMinutes} min` : undefined }))} />
        </Card>
      </div>
      <Card>
        <Title>Recent episodes</Title>
        <div className="divide-y divide-slate-100">
          {p.episodes.recent.map((e: any) => (
            <div key={e._id} className="py-2.5 text-sm flex gap-3">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-rose-50 text-rose-700 font-bold flex items-center justify-center">{e.intensity}</span>
              <div className="min-w-0">
                <div className="font-medium">{e.trigger || 'Episode'} <span className="text-slate-400 font-normal">· {e.durationMinutes ?? '–'} min</span></div>
                <div className="text-xs text-slate-500">{[e.activity, e.location].filter(Boolean).join(' · ')} · {when(e.ts)}</div>
                {e.response && <div className="text-xs text-slate-600 mt-0.5">{e.response}</div>}
              </div>
            </div>
          ))}
          {!p.episodes.recent.length && <Empty text="No episodes in this period." />}
        </div>
      </Card>
    </div>
  );
}

function Routines({ p }: { p: P }) {
  const r = p.routines;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Overall adherence" value={val(r.overallAdherencePct, '%')} hint="completed vs skipped, 7 days" />
        <Stat label="Most skipped" value={<span className="text-base">{r.mostSkipped || 'None 🎉'}</span>} />
      </div>
      <Card>
        <Title>Last 7 days (oldest → today)</Title>
        <div className="space-y-4">
          {r.items.map((it: any) => (
            <div key={it._id}>
              <div className="flex justify-between text-sm"><span className="font-medium">{it.title}</span><span className="text-xs text-slate-500">{it.scheduleTime} · {val(it.adherencePct, '%')}</span></div>
              <div className="flex gap-1.5 mt-1.5">
                {[...it.last7Days].reverse().map((s: string, i: number) => {
                  const Icon = s === 'completed' ? CheckCircle2 : s === 'skipped' ? XCircle : Circle;
                  return <Icon key={i} className={`w-5 h-5 ${dot[s]}`} aria-label={s} />;
                })}
              </div>
            </div>
          ))}
          {!r.items.length && <Empty text="No routines set up yet." />}
        </div>
      </Card>
    </div>
  );
}

function Goals({ p }: { p: P }) {
  const w = p.progress.worksheets;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Worksheets done" value={w.total} />
        <Stat label="Avg score" value={val(w.avgPercent, '%')} />
        <Stat label="Avg engagement" value={val(w.avgEngagement, '/5')} />
        <Stat label="Practice time" value={`${w.totalMinutes} min`} />
      </div>
      <Card>
        <Title>Goals</Title>
        <div className="space-y-4">
          {p.goals.map((g: any) => (
            <div key={g._id}>
              <div className="flex justify-between items-center gap-3 text-sm">
                <div><div className="font-medium">{g.title}</div><div className="text-xs text-slate-500">{g.area}</div></div>
                <div className="flex items-center gap-3 shrink-0"><Spark values={g.history.map((h: any) => h.score)} /><span className="text-xs text-slate-600">{g.currentScore} / {g.targetScore}</span></div>
              </div>
              <div className="mt-1.5"><Bar percent={g.percentOfTarget || 0} color={g.percentOfTarget >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'} label={g.title} /></div>
            </div>
          ))}
          {!p.goals.length && <Empty text="No goals yet." />}
        </div>
      </Card>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card><Title>Recent worksheets</Title>
          <div className="divide-y divide-slate-100 text-sm">
            {w.recent.map((s: any) => (
              <div key={s._id} className="py-2"><div className="flex justify-between"><span className="font-medium">{s.area} · {s.worksheetId}</span><span>{s.percent}%</span></div>
                <div className="text-xs text-slate-500">{day(s.ts)} · {s.minutes ?? '–'} min{s.notes ? ` · ${s.notes}` : ''}</div></div>
            ))}
            {!w.recent.length && <Empty text="No worksheets yet." />}
          </div>
        </Card>
        <Card><Title>Activity feedback</Title>
          <div className="divide-y divide-slate-100 text-sm">
            {p.activities.slice(0, 8).map((a: any) => (
              <div key={a._id} className="py-2"><div className="flex justify-between"><span className="font-medium">{a.title}</span><span className="text-xs text-slate-500">{a.rating}</span></div>
                {a.notes && <div className="text-xs text-slate-500">{a.notes}</div>}</div>
            ))}
            {!p.activities.length && <Empty text="No activity feedback yet." />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NotesTeam({ p }: { p: P }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card><Title>Notes</Title>
        <div className="space-y-3">
          {p.notes.map((n: any) => (
            <div key={n._id} className="text-sm"><div className="text-xs text-slate-500">{n.author} ({n.authorRole}) · {when(n.ts)}</div><p className="mt-0.5">{n.text}</p></div>
          ))}
          {!p.notes.length && <Empty text="No notes yet." />}
        </div>
      </Card>
      <div className="space-y-5">
        <Card><Title>Contacts</Title>
          <div className="space-y-3">
            {p.contacts.map((c: any) => (
              <div key={c._id} className="text-sm"><div className="font-medium">{c.name} <span className="text-slate-400 font-normal">· {c.role}</span></div>
                <div className="flex flex-wrap gap-x-4 text-xs text-slate-500 mt-0.5">
                  {c.phone && <a className="inline-flex items-center gap-1 hover:text-indigo-600" href={`tel:${c.phone}`}><Phone className="w-3 h-3" />{c.phone}</a>}
                  {c.email && <a className="inline-flex items-center gap-1 hover:text-indigo-600" href={`mailto:${c.email}`}><Mail className="w-3 h-3" />{c.email}</a>}
                </div></div>
            ))}
          </div>
        </Card>
        {p.learning && (
          <Card><Title>Parent learning</Title>
            <div className="text-sm text-slate-600">{p.learning.lessonsDone} lessons · {p.learning.quizzesTaken} quiz attempts · {p.learning.activeDays} active days</div>
          </Card>
        )}
      </div>
    </div>
  );
}


// ---------- AI insights ----------
const call = async (path: string, init?: RequestInit) => {
  const res = await authFetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
};
const kindStyle: Record<string, { cls: string; Icon: any }> = {
  watch: { cls: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle },
  positive: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: ThumbsUp },
  info: { cls: 'border-slate-200 bg-white text-slate-700', Icon: Info },
};

function InsightsTab({ childId, version }: { childId: string; version: string }) {
  const [findings, setFindings] = useState<any[] | null>(null);
  const [ai, setAi] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const generate = useCallback(async (refresh = false) => {
    setBusy(true); setErr('');
    try {
      const [f, a] = await Promise.all([
        call(`/api/children/${childId}/insights`),
        call(`/api/children/${childId}/insights/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) }),
      ]);
      setFindings(f.findings); setAi(a);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }, [childId]);

  // re-run whenever the underlying data changes (the server only regenerates the AI text if it really changed)
  useEffect(() => { generate(false); }, [generate, version]);

  if (err && !findings) return <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">Couldn&apos;t load insights ({err}). <button onClick={() => generate()} className="underline font-medium">Retry</button></Card>;
  if (!findings) return <p className="text-sm text-slate-500">Analysing data…</p>;

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
          <Sparkles className="w-4 h-4" /> Summary and suggestions
          <span className="ml-auto text-xs font-normal text-slate-400">{ai ? (ai.source === 'ollama' ? 'AI generated' : 'Generated from your data') : ''}{ai?.cached ? ' · up to date' : ''}</span>
          <button onClick={() => generate(true)} disabled={busy} title="Regenerate" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /></button>
        </div>
        {ai ? (
          <>
            <p className="text-sm text-slate-700 mt-2">{ai.summary}</p>
            <div className="mt-3 grid md:grid-cols-2 gap-3">
              {ai.suggestions.map((s: any, i: number) => (
                <div key={i} className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-sm">
                  <div className="font-semibold text-indigo-900">{s.title}</div>
                  {s.why && <div className="text-xs text-slate-600 mt-1">{s.why}</div>}
                  {s.how && <div className="mt-1.5">➜ {s.how}</div>}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">General guidance based on the logged data. Not medical advice; discuss changes with your therapist.</p>
          </>
        ) : <p className="text-sm text-slate-500 mt-2">{busy ? 'Thinking…' : 'No summary yet.'}</p>}
        {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
      </Card>
      <div>
        <Title>What the data shows</Title>
        <div className="grid md:grid-cols-2 gap-3">
          {findings.map((f) => {
            const { cls, Icon } = kindStyle[f.kind] || kindStyle.info;
            return (
              <div key={f.id} className={`rounded-xl border p-4 text-sm ${cls}`}>
                <div className="flex items-start gap-2 font-semibold"><Icon className="w-4 h-4 mt-0.5 shrink-0" />{f.title}</div>
                <div className="mt-1 opacity-90">{f.detail}</div>
                {f.suggestion && <div className="mt-1.5 text-xs opacity-80">Try: {f.suggestion}</div>}
              </div>
            );
          })}
          {!findings.length && <Empty text="Not enough data yet." />}
        </div>
      </div>
    </div>
  );
}

// ---------- therapist tools ----------
function TherapistTools({ p, onSaved }: { p: P; onSaved: () => void }) {
  const areas: string[] = Array.from(new Set<string>([...p.goals.map((g: any) => g.area), 'Sensory Regulation'].filter(Boolean)));
  const [msg, setMsg] = useState('');
  const [rev, setRev] = useState({ area: areas[0] || 'Sensory Regulation', score: 50, obs: '' });
  const [ms, setMs] = useState('');
  const [goal, setGoal] = useState({ area: '', title: '', targetScore: 80 });
  const post = async (path: string, body: any, done: string, reset: () => void) => {
    try {
      await call(`/api/children/${p.child._id}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      reset(); setMsg(done); onSaved();
    } catch (e: any) { setMsg(e.message); }
    setTimeout(() => setMsg(''), 3000);
  };
  const inp = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';
  const btn = 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium';
  return (
    <Card className="border-indigo-200">
      <Title>Therapist tools {msg && <span className="ml-2 text-xs font-normal text-emerald-600">{msg}</span>}</Title>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-600">Progress review</div>
          <select className={inp} value={rev.area} onChange={(e) => setRev({ ...rev, area: e.target.value })}>{areas.map((a) => <option key={a}>{a}</option>)}</select>
          <label className="text-xs text-slate-500">Score: {rev.score}/100<input type="range" min={0} max={100} value={rev.score} onChange={(e) => setRev({ ...rev, score: Number(e.target.value) })} className="w-full accent-indigo-600" /></label>
          <input className={inp} placeholder="Observation" value={rev.obs} onChange={(e) => setRev({ ...rev, obs: e.target.value })} />
          <button className={btn} onClick={() => post('progress', rev, 'Review saved', () => setRev({ ...rev, obs: '' }))}>Save review</button>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-600">Milestone reached</div>
          <input className={inp} placeholder="e.g. Asked for a break without prompting" value={ms} onChange={(e) => setMs(e.target.value)} />
          <button className={btn} disabled={!ms.trim()} onClick={() => post('milestones', { title: ms }, 'Milestone added', () => setMs(''))}>Add milestone</button>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-600">New goal</div>
          <input className={inp} placeholder="Area (e.g. Emotions)" list="goal-areas" value={goal.area} onChange={(e) => setGoal({ ...goal, area: e.target.value })} />
          <datalist id="goal-areas">{areas.map((a) => <option key={a} value={a} />)}</datalist>
          <input className={inp} placeholder="Goal title" value={goal.title} onChange={(e) => setGoal({ ...goal, title: e.target.value })} />
          <input type="number" min={1} max={100} className={inp} value={goal.targetScore} onChange={(e) => setGoal({ ...goal, targetScore: Number(e.target.value) })} />
          <button className={btn} disabled={!goal.area.trim() || !goal.title.trim()} onClick={() => post('goals', goal, 'Goal added', () => setGoal({ area: '', title: '', targetScore: 80 }))}>Add goal</button>
        </div>
      </div>
    </Card>
  );
}

// ---------- hub ----------
export default function ProfileHub({ childId }: { childId: string }) {
  const [p, setP] = useState<P | null>(null);
  const [tab, setTab] = useState<TabName>('Overview');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const version = useRef('');
  const isTherapist = getSession()?.user.role === 'therapist';

  const load = useCallback(async (silent = false) => {
    if (!silent) setBusy(true);
    try {
      const res = await authFetch(`/api/children/${childId}/profile`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      if (data.dataVersion !== version.current) { version.current = data.dataVersion; setP(data); }
      setError('');
    } catch (e: any) { if (!silent) setError(e.message); }
    finally { setBusy(false); }
  }, [childId]);

  useEffect(() => { version.current = ''; setP(null); load(); const t = setInterval(() => load(true), 30000); return () => clearInterval(t); }, [load]);

  if (error && !p) return <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">Couldn&apos;t load the profile ({error}). <button onClick={() => load()} className="underline font-medium">Retry</button></Card>;
  if (!p) return <p className="text-sm text-slate-500">Loading profile…</p>;

  return (
    <div className="space-y-5">
      <Card className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 text-xl font-bold flex items-center justify-center">{p.child.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold">{p.child.name}</div>
          <div className="text-xs text-slate-500">{p.child.age} years old · parent {p.team.parent?.name || '–'} · {p.team.therapists.length} therapist(s)</div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">{p.child.primaryTriggers.map((t: string) => <span key={t} className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px]">{t}</span>)}</div>
        </div>
        <button onClick={() => load()} title="Sync now" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /></button>
      </Card>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>
      {tab === 'Overview' && <Overview p={p} />}
      {tab === 'Episodes' && <Episodes p={p} />}
      {tab === 'Routines' && <Routines p={p} />}
      {tab === 'Goals & progress' && (<div className="space-y-5">{isTherapist && <TherapistTools p={p} onSaved={() => load()} />}<Goals p={p} /></div>)}
      {tab === 'AI insights' && <InsightsTab childId={childId} version={p.dataVersion} />}
      {tab === 'Notes & team' && <NotesTeam p={p} />}
      <p className="text-[11px] text-slate-400 text-right">Synced {when(p.generatedAt)} · updates automatically</p>
    </div>
  );
}