'use client';
import React, { useEffect, useState } from 'react';
import { Pencil, ArrowRight } from 'lucide-react';
import { teachingApi } from './api';
import type { Overview } from './types';
import { Card, Bar } from '../learning/ui';

export default function TeachingSummaryCard({ childId, parentId, onOpen }: { childId: string; parentId: string; onOpen: () => void }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  useEffect(() => { teachingApi.overview({ childId, parentId }).then(setOverview).catch(() => {}); }, [childId, parentId]);
  if (!overview || overview.modules.length === 0) return null;
  const rec = overview.recommendations[0];
  return <Card className="space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><Pencil className="w-4 h-4" /> Teaching at home</div><span className="text-sm font-bold text-indigo-600">{overview.stats.avgPercent === null ? '—' : `${overview.stats.avgPercent}% avg`}</span></div><Bar percent={overview.stats.worksheetsTotal ? Math.round((overview.stats.worksheetsDone / overview.stats.worksheetsTotal) * 100) : 0} label="Teaching progress" /><div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-600 truncate">{rec ? `Next: ${rec.title}` : 'All worksheets tried'}</span><button onClick={onOpen} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0">{overview.stats.sessions === 0 ? 'Start' : 'Open'} <ArrowRight className="w-4 h-4" /></button></div></Card>;
}
