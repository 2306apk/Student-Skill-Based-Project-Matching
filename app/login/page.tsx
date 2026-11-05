'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      router.push(data.redirectUrl || '/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 text-white shadow-sm mb-4">
          <GraduationCap className="w-6 h-6 text-sky-400" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Student Skill–Project Matching
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          DBMS Level 3 Capstone Application • Sign in to your portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@gmail.com or admin@college.edu"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-transparent rounded text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Demo Credentials Quick-Select */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Demo Credentials (from MySQL seed)
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillDemo('admin@college.edu', 'Admin@123')}
                className="w-full text-left p-2 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-medium text-slate-800">Admin</span>
                  <span className="text-slate-400 font-mono text-[11px]">admin@college.edu</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Admin@123</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('rahul@gmail.com', 'Student@123')}
                className="w-full text-left p-2 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-medium text-slate-800">Student (Rahul)</span>
                  <span className="text-slate-400 font-mono text-[11px]">rahul@gmail.com</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Student@123</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('ananya@gmail.com', 'Student@123')}
                className="w-full text-left p-2 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-medium text-slate-800">Student (Ananya)</span>
                  <span className="text-slate-400 font-mono text-[11px]">ananya@gmail.com</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Student@123</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          PES University • Department of Computer Science & Engineering
        </div>
      </div>
    </div>
  );
}
