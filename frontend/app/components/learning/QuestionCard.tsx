'use client';
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Question, QResult } from './types';

export default function QuestionCard({ q, number, value, result, onPick }: {
  q: Question; number?: number; value?: number; result?: QResult; onPick: (i: number) => void;
}) {
  const locked = !!result;
  return (
    <div className="space-y-3">
      <p className="font-medium text-slate-800">{number ? `${number}. ` : ''}{q.q}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const picked = value === i;
          let cls = 'border-slate-300 hover:bg-slate-50';
          if (picked && !locked) cls = 'border-indigo-500 bg-indigo-50';
          if (locked && i === result!.correctIndex) cls = 'border-emerald-500 bg-emerald-50';
          else if (locked && picked) cls = 'border-rose-400 bg-rose-50';
          return (
            <button key={i} type="button" disabled={locked} onClick={() => onPick(i)}
              className={`w-full text-left text-sm rounded-lg border px-4 py-3 flex items-start gap-3 transition ${cls}`}>
              <span className="mt-0.5 shrink-0 text-xs font-semibold text-slate-400 w-4">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{opt}</span>
              {locked && i === result!.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {locked && picked && !result!.correct && <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>
      {locked && (
        <p className={`text-sm rounded-lg px-3 py-2 ${result!.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
          <b>{result!.correct ? 'Right. ' : 'Not quite. '}</b>{result!.explanation}
        </p>
      )}
    </div>
  );
}