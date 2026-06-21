'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">Password Reset!</h1>
        <p className="text-[14px] text-gray-500 mt-2">
          Your password has been changed successfully. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">Reset Password</h1>
        <p className="text-[14px] text-gray-500 mt-1">Choose a new password for your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!tokenFromUrl && (
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Reset Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste reset token from email"
              required
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 px-4 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all"
            />
          </div>
        )}

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">New Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 pl-12 pr-12 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-[12px] font-medium text-center bg-red-50 rounded-lg py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password || !token}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[15px] font-extrabold shadow-lg shadow-amber-200 hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
