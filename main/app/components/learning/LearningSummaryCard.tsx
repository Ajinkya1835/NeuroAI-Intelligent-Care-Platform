'use client';
import React, { useEffect, useState } from 'react';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { learningApi } from './api';
import type { Overview } from './types';
import { Card, Bar } from './ui';

// Small dashboard card: overall learning progress + a way back in.
export default function LearningSummaryCard({ parentId, onOpen }: { parentId: string; onOpen: () => void }) {
  const [o, setO] = useState<Overview | null>(null);
  useEffect(() => { learningApi.overview(parentId).then(setO).catch(() => {}); }, [parentId]);
  if (!o || o.modules.length === 0) return null;

  const c = o.continue;
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><GraduationCap className="w-4 h-4" /> Parent learning</div>
        <span className="text-sm font-bold text-indigo-600">{o.stats.percent}%</span>
      </div>
      <Bar percent={o.stats.percent} label="Learning progress" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600 truncate">{c ? c.title : 'All lessons completed'}</span>
        <button onClick={onOpen} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0">
          {c ? (o.stats.percent === 0 ? 'Start' : 'Continue') : 'Review'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}