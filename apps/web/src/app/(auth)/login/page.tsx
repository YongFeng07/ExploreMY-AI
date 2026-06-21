'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth-store';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await login(email, password);
      router.push('/explore');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Welcome back</h1>
          <p className="text-[14px] text-gray-500 mt-1">Sign in to your Travel Passport</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com" required
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 pl-12 pr-4 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 pl-12 pr-12 text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-[12px] font-medium text-center bg-red-50 rounded-lg py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[15px] font-extrabold shadow-lg shadow-amber-200 hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[13px] text-gray-500 mt-4">
          <Link href="/forgot-password" className="text-amber-600 font-medium hover:underline">Forgot password?</Link>
        </p>
        <p className="text-center text-[13px] text-gray-500 mt-2">
          Don&apos;t have an account? <Link href="/register" className="text-amber-600 font-bold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
