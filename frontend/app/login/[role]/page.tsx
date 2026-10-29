'use client';

import Link from 'next/link';
import LoginForm from '../../components/auth/LoginForm';

export default function RoleLoginPage({ params }: { params: { role: string } }) {
  if (params.role !== 'parent' && params.role !== 'therapist') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">
        Unknown login type. <Link href="/login" className="ml-1 text-indigo-600 underline">Choose a login</Link>
      </div>
    );
  }
  return <LoginForm role={params.role} />;
}
