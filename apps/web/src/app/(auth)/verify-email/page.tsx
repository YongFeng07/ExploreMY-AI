// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, XCircle, Sparkles } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check your email link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API}/api/v1/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. The link may have expired.');
        }
      } catch {
        setStatus('error');
        setMessage('Unable to verify email. Please try again later.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="text-center">
      {status === 'verifying' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-200 animate-pulse">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Verifying...</h1>
          <p className="text-[14px] text-gray-500 mt-2">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Email Verified!</h1>
          <p className="text-[14px] text-gray-500 mt-2">{message}</p>
          <p className="text-[12px] text-gray-400 mt-4">Redirecting to login...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
            <XCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Verification Failed</h1>
          <p className="text-[14px] text-gray-500 mt-2">{message}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-amber-600 font-bold hover:underline"
          >
            Go to Sign In
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-200 animate-pulse">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-[28px] font-extrabold text-gray-900">Loading...</h1>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
