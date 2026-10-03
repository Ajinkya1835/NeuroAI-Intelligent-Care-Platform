'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap, ChevronLeft, ArrowRight, CheckCircle2, Circle, Clock, Flame, Trophy, RotateCcw, Lock,
} from 'lucide-react';
import { learningApi } from './api';
import type { Module, ModuleProgress, Overview, SubmitResult, Chapter } from './types';
import { Card, Bar, btnPrimary, btnGhost } from './ui';
import RichText from './RichText';
import QuestionCard from './QuestionCard';

type View =
  | { name: 'hub' }
  | { name: 'module'; slug: string }
  | { name: 'lesson'; slug: string; id: string }
  | { name: 'quiz'; slug: string; id: string };
type Step = { kind: 'lesson' | 'quiz'; chapterId: string; id: string; title: string };
type Data = { module: Module; progress: ModuleProgress };

const levelChip = 'text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded';

export default function LearningHub({ parentId, toast }: { parentId: string; toast: (m: string) => void }) {
  const [view, setView] = useState<View>({ name: 'hub' });
  const [overview, setOverview] = useState<Overview | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  const loadOverview = useCallback(() => {
    learningApi.overview(parentId).then((o) => { setOverview(o); setError(''); }).catch((e) => setError(e.message));
  }, [parentId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const go = useCallback(async (next: View) => {
    window.scrollTo({ top: 0 });
    if (next.name === 'hub') { setView(next); loadOverview(); return; }
    if (next.name === 'module' || !data || data.module.slug !== next.slug) {
      try { setData(await learningApi.module(next.slug, parentId)); }
      catch (e: any) { toast(e.message || 'Could not open this module'); return; }
    }
    setView(next);
  }, [data, parentId, loadOverview, toast]);

  const sequence: Step[] = useMemo(() => !data ? [] : data.module.chapters.flatMap((c) => [
    ...c.subchapters.map((s) => ({ kind: 'lesson' as const, chapterId: c.id, id: s.id, title: s.title })),
    { kind: 'quiz' as const, chapterId: c.id, id: c.id, title: `${c.title}: chapter quiz` },
  ]), [data]);

  const slug = view.name === 'hub' ? '' : view.slug;
  const openStep = (s: Step) => go(s.kind === 'lesson' ? { name: 'lesson', slug, id: s.id } : { name: 'quiz', slug, id: s.id });
  const onProgress = (progress: ModuleProgress) => setData((d) => (d ? { ...d, progress } : d));

  if (error && !overview) {
    return (
      <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">
        Couldn&apos;t load the learning area ({error}). Check that the backend is running.
        <button onClick={loadOverview} className="ml-2 underline font-medium">Retry</button>
      </Card>
    );
  }
  if (!overview) return <p className="text-sm text-slate-500">Loading…</p>;

  if (view.name === 'hub') {
    return (
      <Hub overview={overview}
        onOpen={(s) => go({ name: 'module', slug: s })}
        onContinue={() => {
          const c = overview.continue;
          if (c) go(c.kind === 'lesson' ? { name: 'lesson', slug: c.moduleSlug, id: c.id } : { name: 'quiz', slug: c.moduleSlug, id: c.id });
        }} />
    );
  }
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  if (view.name === 'module') {
    return <ModuleView data={data} onBack={() => go({ name: 'hub' })} onOpen={openStep} />;
  }
  if (view.name === 'lesson') {
    return <LessonView key={view.id} data={data} id={view.id} sequence={sequence} parentId={parentId}
      onProgress={onProgress} onOpen={openStep} onBack={() => go({ name: 'module', slug })} />;
  }
  return <QuizView key={view.id} data={data} id={view.id} sequence={sequence} parentId={parentId}
    onProgress={onProgress} onOpen={openStep} onBack={() => go({ name: 'module', slug })} />;
}

/* ---------------------------------- Hub ---------------------------------- */

function Hub({ overview, onOpen, onContinue }: { overview: Overview; onOpen: (slug: string) => void; onContinue: () => void }) {
  const s = overview.stats;
  const c = overview.continue;
  const tiles = [
    { l: 'Lessons done', v: `${s.lessonsDone}/${s.lessonsTotal}` },
    { l: 'Chapter quizzes', v: `${s.quizzesDone}/${s.quizzesTotal}` },
    { l: 'Answers correct', v: s.accuracy === null ? '—' : `${s.accuracy}%` },
    { l: 'Day streak', v: s.streak, flame: true },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600" /> Parent learning</h2>
        <p className="text-sm text-slate-500 mt-1">Short lessons with a quick check after each one. Go at your own pace, stop anytime and pick up later.</p>
      </div>

      <Card>
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm font-semibold">Your progress</span>
          <span className="text-2xl font-bold text-indigo-600">{s.percent}%</span>
        </div>
        <Bar percent={s.percent} label="Overall progress" />
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {s.minutesLeft > 0 ? `About ${s.minutesLeft} min left in total` : 'Everything completed'}
        </p>
      </Card>

      {c ? (
        <Card className="border-indigo-200 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-indigo-700 font-medium">{overview.stats.lessonsDone + overview.stats.quizzesDone === 0 ? 'Start here' : 'Pick up where you left off'}</div>
            <div className="font-semibold truncate">{c.title}</div>
            <div className="text-xs text-slate-500 truncate">{c.moduleTitle}</div>
          </div>
          <button onClick={onContinue} className={btnPrimary}>{c.kind === 'quiz' ? 'Take the quiz' : 'Continue'} <ArrowRight className="w-4 h-4" /></button>
        </Card>
      ) : overview.modules.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-800">You&apos;ve completed everything available. New modules will show up here.</Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Card key={t.l} className="!p-4">
            <div className="text-xs text-slate-500">{t.l}</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-1">
              {t.flame && <Flame className={`w-5 h-5 ${Number(t.v) > 0 ? 'text-orange-500' : 'text-slate-300'}`} />}{t.v}
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Modules</h3>
        {overview.modules.length === 0 && <Card><p className="text-sm text-slate-400">No modules yet.</p></Card>}
        {overview.modules.map((m) => (
          <Card key={m.slug} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {m.level && <span className={levelChip}>{m.level}</span>}
                <h4 className="font-semibold mt-1">{m.title}</h4>
                {m.summary && <p className="text-sm text-slate-500 mt-0.5">{m.summary}</p>}
              </div>
              <span className="text-sm font-bold text-indigo-600 shrink-0">{m.percent}%</span>
            </div>
            <Bar percent={m.percent} color={m.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'} label={`${m.title} progress`} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {m.status === 'completed' ? 'Completed' : m.minutesLeft > 0 ? `About ${m.minutesLeft} min left` : ''}
              </span>
              <button onClick={() => onOpen(m.slug)} className={m.status === 'completed' ? btnGhost : btnPrimary}>
                {m.status === 'not_started' ? 'Start' : m.status === 'completed' ? 'Review' : 'Continue'}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Module -------------------------------- */

function ModuleView({ data, onBack, onOpen }: { data: Data; onBack: () => void; onOpen: (s: Step) => void }) {
  const { module: m, progress: p } = data;
  const done = new Set(p.completedLessons);
  const next = p.nextUp;
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> All modules</button>

      <Card className="space-y-3">
        <div>
          {m.level && <span className={levelChip}>{m.level}</span>}
          <h2 className="text-lg font-bold mt-1">{m.title}</h2>
          {m.summary && <p className="text-sm text-slate-500 mt-1">{m.summary}</p>}
        </div>
        <Bar percent={p.percent} color={p.percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'} label="Module progress" />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span><b className="text-slate-700">{p.percent}%</b> complete</span>
          <span>Lessons {p.lessonsDone}/{p.lessonsTotal}</span>
          <span>Quizzes {p.quizzesDone}/{p.quizzesTotal}</span>
          {p.minutesLeft > 0 && <span>About {p.minutesLeft} min left</span>}
        </div>
        {next && (
          <button onClick={() => onOpen(next)} className={`${btnPrimary} w-full sm:w-auto`}>
            {p.percent === 0 ? 'Start' : 'Continue'}: {next.title} <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {m.outcomes && m.outcomes.length > 0 && (
          <details className="text-sm text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">What you&apos;ll learn</summary>
            <ul className="list-disc pl-5 mt-2 space-y-1">{m.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
          </details>
        )}
      </Card>

      {p.percent >= 100 && m.keyTakeaways && (
        <Card className="border-emerald-200 bg-emerald-50 space-y-2">
          <div className="font-semibold text-emerald-800 flex items-center gap-2"><Trophy className="w-4 h-4" /> Module complete. Well done.</div>
          <div className="text-xs text-emerald-700">Key takeaways</div>
          <ul className="list-disc pl-5 text-sm text-emerald-900 space-y-1">{m.keyTakeaways.map((k) => <li key={k}>{k}</li>)}</ul>
        </Card>
      )}

      {m.chapters.map((c, ci) => <ChapterCard key={c.id} chapter={c} index={ci} progress={p} done={done} next={next} onOpen={onOpen} />)}
    </div>
  );
}

function ChapterCard({ chapter: c, index, progress: p, done, next, onOpen }: {
  chapter: Chapter; index: number; progress: ModuleProgress; done: Set<string>; next: Step | null; onOpen: (s: Step) => void;
}) {
  const doneCount = c.subchapters.filter((s) => done.has(s.id)).length;
  const unlocked = doneCount === c.subchapters.length;
  const qr = p.quizResults[c.id];
  const quizDone = !!qr && qr.attempts > 0;
  const rowBase = 'w-full flex items-center gap-3 text-left px-3 py-3 rounded-lg';
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Chapter {index + 1}</div>
            <h3 className="font-semibold">{c.title}</h3>
          </div>
          <span className="text-xs text-slate-500 shrink-0">{doneCount}/{c.subchapters.length} lessons</span>
        </div>
        <div className="mt-3"><Bar percent={Math.round(((doneCount + (quizDone ? 1 : 0)) / (c.subchapters.length + 1)) * 100)} label={`${c.title} progress`} /></div>
      </div>
      <div className="p-2">
        {c.subchapters.map((s) => {
          const isDone = done.has(s.id);
          const isNext = next?.kind === 'lesson' && next.id === s.id;
          const r = p.lessonResults[s.id];
          return (
            <button key={s.id} onClick={() => onOpen({ kind: 'lesson', chapterId: c.id, id: s.id, title: s.title })}
              className={`${rowBase} hover:bg-slate-50 ${isNext ? 'bg-indigo-50/70' : ''}`}>
              {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
              <span className={`flex-1 text-sm ${isNext ? 'font-semibold' : ''}`}>{s.title}</span>
              {isNext && <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">UP NEXT</span>}
              <span className="text-xs text-slate-400 shrink-0">{isDone && r && r.total > 0 ? `${r.correct}/${r.total}` : `${s.minutes} min`}</span>
            </button>
          );
        })}
        <button disabled={!unlocked} onClick={() => onOpen({ kind: 'quiz', chapterId: c.id, id: c.id, title: `${c.title}: chapter quiz` })}
          className={`${rowBase} ${unlocked ? 'hover:bg-slate-50' : 'opacity-60 cursor-not-allowed'} ${next?.kind === 'quiz' && next.id === c.id ? 'bg-indigo-50/70' : ''}`}>
          {!unlocked ? <Lock className="w-5 h-5 text-slate-300 shrink-0" /> : quizDone ? <Trophy className="w-5 h-5 text-amber-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
          <span className="flex-1 text-sm">
            Chapter quiz <span className="text-slate-400">· {c.quiz.length} questions</span>
          </span>
          <span className="text-xs text-slate-400 shrink-0">
            {!unlocked ? 'Finish lessons first' : quizDone ? `Best ${qr.best}/${qr.total}` : 'Not taken yet'}
          </span>
        </button>
      </div>
    </Card>
  );
}

/* --------------------------------- Lesson -------------------------------- */

function LessonView({ data, id, sequence, parentId, onProgress, onOpen, onBack }: {
  data: Data; id: string; sequence: Step[]; parentId: string;
  onProgress: (p: ModuleProgress) => void; onOpen: (s: Step) => void; onBack: () => void;
}) {
  const m = data.module;
  const chapter = m.chapters.find((c) => c.subchapters.some((s) => s.id === id))!;
  const li = chapter.subchapters.findIndex((s) => s.id === id);
  const lesson = chapter.subchapters[li];
  const next = sequence[sequence.findIndex((s) => s.kind === 'lesson' && s.id === id) + 1];

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const allAnswered = lesson.questions.every((q) => Number.isInteger(answers[q.id]));
  const byId = Object.fromEntries((result?.results || []).map((r) => [r.id, r]));
  const doneInChapter = chapter.subchapters.filter((s) => data.progress.completedLessons.includes(s.id)).length;

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const r = await learningApi.submit(m.slug, { parentId, scope: 'lesson', targetId: id, answers });
      setResult(r); onProgress(r.progress);
    } catch (e: any) { setErr(e.message || 'Could not save. Try again.'); }
    setBusy(false);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> {m.title}</button>

      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>{chapter.title} · Lesson {li + 1} of {chapter.subchapters.length}</span>
          <span>{doneInChapter}/{chapter.subchapters.length} done</span>
        </div>
        <Bar percent={Math.round((doneInChapter / chapter.subchapters.length) * 100)} label="Chapter progress" />
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">{lesson.title}</h2>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {lesson.minutes} min read</div>
        </div>
        {lesson.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lesson.image} alt="" className="w-full rounded-lg border border-slate-200"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        )}
        <RichText text={lesson.body} />
        {lesson.takeaway && (
          <div className="rounded-lg bg-emerald-50 text-emerald-900 text-sm px-4 py-3"><b>Key point: </b>{lesson.takeaway}</div>
        )}
        {lesson.sources && lesson.sources.length > 0 && (
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">Sources</summary>
            <ul className="mt-1 space-y-0.5">
              {lesson.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">{s.label}</a></li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      {lesson.questions.length > 0 && (
        <Card className="space-y-5">
          <div>
            <h3 className="font-semibold">Quick check</h3>
            <p className="text-xs text-slate-500 mt-0.5">No pressure. This just helps it stick.</p>
          </div>
          {lesson.questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} number={lesson.questions.length > 1 ? i + 1 : undefined}
              value={answers[q.id]} result={byId[q.id]} onPick={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          ))}
        </Card>
      )}

      {err && <p className="text-sm text-rose-600">{err}</p>}

      {!result ? (
        <button onClick={submit} disabled={!allAnswered || busy} className={`${btnPrimary} w-full sm:w-auto`}>
          {busy ? 'Saving…' : lesson.questions.length ? 'Check my answers' : 'Mark as done'}
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Lesson complete{result.total > 0 ? ` · ${result.correct}/${result.total} correct` : ''}</span>
          {next
            ? <button onClick={() => onOpen(next)} className={`${btnPrimary} sm:ml-auto`}>{next.kind === 'quiz' ? 'Go to chapter quiz' : `Next: ${next.title}`} <ArrowRight className="w-4 h-4" /></button>
            : <button onClick={onBack} className={`${btnPrimary} sm:ml-auto`}>Finish module</button>}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Quiz --------------------------------- */

function QuizView({ data, id, sequence, parentId, onProgress, onOpen, onBack }: {
  data: Data; id: string; sequence: Step[]; parentId: string;
  onProgress: (p: ModuleProgress) => void; onOpen: (s: Step) => void; onBack: () => void;
}) {
  const m = data.module;
  const chapter = m.chapters.find((c) => c.id === id)!;
  const qs = chapter.quiz;
  const next = sequence[sequence.findIndex((s) => s.kind === 'quiz' && s.id === id) + 1];
  const unlocked = chapter.subchapters.every((s) => data.progress.completedLessons.includes(s.id));

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const q = qs[idx];
  const allAnswered = qs.every((x) => Number.isInteger(answers[x.id]));
  const byId = Object.fromEntries((result?.results || []).map((r) => [r.id, r]));

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const r = await learningApi.submit(m.slug, { parentId, scope: 'quiz', targetId: id, answers });
      setResult(r); onProgress(r.progress); window.scrollTo({ top: 0 });
    } catch (e: any) { setErr(e.message || 'Could not save. Try again.'); }
    setBusy(false);
  };
  const retake = () => { setResult(null); setAnswers({}); setIdx(0); setErr(''); };

  if (!unlocked) {
    return (
      <div className="space-y-4 max-w-2xl">
        <button onClick={onBack} className="text-sm text-slate-500 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> {m.title}</button>
        <Card className="text-sm text-slate-600">Finish the lessons in <b>{chapter.title}</b> first, then come back for the quiz.</Card>
      </div>
    );
  }

  if (result) {
    const pct = Math.round((result.correct / result.total) * 100);
    const msg = pct >= 80 ? "Great work. You've got a solid grip on this chapter."
      : pct >= 60 ? 'Good effort. Have a look at the explanations below.'
      : "That's okay, this is how it sticks. Read the explanations below and retake whenever you like.";
    return (
      <div className="space-y-5 max-w-2xl">
        <button onClick={onBack} className="text-sm text-slate-500 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> {m.title}</button>
        <Card className="text-center space-y-2">
          <Trophy className={`w-8 h-8 mx-auto ${result.mastered ? 'text-amber-500' : 'text-slate-300'}`} />
          <div className="text-3xl font-bold">{result.correct}/{result.total}</div>
          {result.mastered && <div className="text-xs font-semibold text-amber-600">MASTERED</div>}
          <p className="text-sm text-slate-600">{msg}</p>
        </Card>
        <Card className="space-y-6">
          {qs.map((x, i) => <QuestionCard key={x.id} q={x} number={i + 1} value={answers[x.id]} result={byId[x.id]} onPick={() => {}} />)}
        </Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={retake} className={btnGhost}><RotateCcw className="w-4 h-4" /> Retake quiz</button>
          {next
            ? <button onClick={() => onOpen(next)} className={`${btnPrimary} sm:ml-auto`}>Next: {next.title} <ArrowRight className="w-4 h-4" /></button>
            : <button onClick={onBack} className={`${btnPrimary} sm:ml-auto`}>Finish module</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <button onClick={onBack} className="text-sm text-slate-500 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> {m.title}</button>
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>{chapter.title}: chapter quiz</span><span>Question {idx + 1} of {qs.length}</span>
        </div>
        <Bar percent={Math.round(((idx + 1) / qs.length) * 100)} label="Quiz progress" />
      </div>
      <Card>
        <QuestionCard key={q.id} q={q} value={answers[q.id]} onPick={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
      </Card>
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <div className="flex justify-between">
        {idx > 0 ? <button onClick={() => setIdx(idx - 1)} className={btnGhost}>Back</button> : <span />}
        {idx < qs.length - 1
          ? <button onClick={() => setIdx(idx + 1)} disabled={!Number.isInteger(answers[q.id])} className={btnPrimary}>Next</button>
          : <button onClick={submit} disabled={!allAnswered || busy} className={btnPrimary}>{busy ? 'Saving…' : 'See my results'}</button>}
      </div>
    </div>
  );
}