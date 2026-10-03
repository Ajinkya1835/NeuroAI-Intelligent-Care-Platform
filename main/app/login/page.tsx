'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Stethoscope, ArrowRight } from 'lucide-react';
import { getSession } from '../lib/auth';

export default function LoginChooser() {
  const router = useRouter();
  useEffect(() => { if (getSession()) router.replace('/'); }, [router]);

  const options = [
    { role: 'parent', title: "I'm a parent", sub: 'Log episodes, follow routines, learn and teach at home.', icon: Heart, color: 'bg-indigo-600' },
    { role: 'therapist', title: "I'm a therapist", sub: 'Review patterns and progress, and add shared notes.', icon: Stethoscope, color: 'bg-teal-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl">🧠</div>
          <h1 className="text-xl font-bold mt-3">Welcome to NeuroAI</h1>
          <p className="text-sm text-slate-500">Choose how you want to sign in</p>
        </div>
        {options.map(({ role, title, sub, icon: Icon, color }) => (
          <Link key={role} href={`/login/${role}`}
            className="flex items-center gap-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm rounded-2xl p-5 transition">
            <div className={`w-11 h-11 rounded-xl ${color} text-white flex items-center justify-center shrink-0`}><Icon className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{title}</div>
              <div className="text-xs text-slate-500">{sub}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
