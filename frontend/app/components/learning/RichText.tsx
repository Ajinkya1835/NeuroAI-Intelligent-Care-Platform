'use client';
import React from 'react';

// Tiny renderer for lesson text: blank line = new block, "- " = bullets, "> " = callout, **bold**, *italic*.
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) => {
    if (p.length > 4 && p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.length > 2 && p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
    return p;
  });
}

export default function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
      {text.trim().split(/\n{2,}/).map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}
            </ul>
          );
        }
        if (lines.every((l) => l.startsWith('> '))) {
          return (
            <div key={i} className="border-l-4 border-indigo-300 bg-indigo-50 rounded-r-lg px-4 py-3 text-indigo-900">
              {inline(lines.map((l) => l.slice(2)).join(' '))}
            </div>
          );
        }
        return <p key={i}>{inline(lines.join(' '))}</p>;
      })}
    </div>
  );
}