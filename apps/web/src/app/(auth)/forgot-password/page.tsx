// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Sparkles, ArrowLeft } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Always show success to prevent email enumeration
      setSent(true);
    } catch {
      setSent(true); // Still show success for security
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Check your email</h1>
          <p className="text-[14px] text-gray-500 mt-2">
            If an account exists for {email}, we&apos;ve sent a password reset link.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-amber-600 font-bold hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Forgot Password</h1>
          <p className="text-[14px] text-gray-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 pl-12 pr-4 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-[12px] font-medium text-center bg-red-50 rounded-lg py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[15px] font-extrabold shadow-lg shadow-amber-200 hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-[13px] text-gray-500 mt-6">
          <Link href="/login" className="text-amber-600 font-bold hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
