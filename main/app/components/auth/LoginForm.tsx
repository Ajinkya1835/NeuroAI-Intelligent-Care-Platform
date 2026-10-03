'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Stethoscope, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { getSession, login, type Role } from '../../lib/auth';

const COPY: Record<Role, { title: string; sub: string; email: string; icon: typeof Heart; accent: string; button: string }> = {
  parent: {
    title: 'Parent login',
    sub: "Track your child's episodes, routines, learning and worksheets.",
    email: 'goon@example.com',
    icon: Heart,
    accent: 'bg-indigo-600',
    button: 'bg-indigo-600 hover:bg-indigo-700',
  },
  therapist: {
    title: 'Therapist login',
    sub: 'Review patterns, progress and notes for the children you support.',
    email: 'dr.ajinkya@neurocare.com',
    icon: Stethoscope,
    accent: 'bg-teal-600',
    button: 'bg-teal-600 hover:bg-teal-700',
  },
};

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500';
const SHOW_DEMO = process.env.NEXT_PUBLIC_SHOW_DEMO_HINT !== 'false';

export default function LoginForm({ role }: { role: Role }) {
  const router = useRouter();
  const c = COPY[role];
  const Icon = c.icon;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // already logged in? go straight to the app
  useEffect(() => { if (getSession()) router.replace('/'); }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await login(email.trim(), password, role);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Could not log in.');
      setBusy(false);
    }
  };

  const other: Role = role === 'parent' ? 'therapist' : 'parent';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Choose a different login
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-11 h-11 rounded-xl ${c.accent} text-white flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{c.title}</h1>
              <p className="text-xs text-slate-500">NeuroAI Care Suite</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-5">{c.sub}</p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Email</span>
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={c.email} className={`${inputCls} mt-1`} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Password</span>
              <div className="relative mt-1">
                <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={busy}
              className={`w-full ${c.button} disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold`}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {SHOW_DEMO && (
            <button type="button" onClick={() => { setEmail(c.email); setPassword('password123'); }}
              className="mt-4 w-full text-xs text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 rounded-lg py-2">
              Demo account: fill in <b>{c.email}</b>
            </button>
          )}
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">
          Not a {role}? <Link href={`/login/${other}`} className="text-indigo-600 font-medium">Use the {other} login</Link>
        </p>
      </div>
    </div>
  );
}
