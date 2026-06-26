// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If already signed in, go to explore
    const timer = setInterval(() => {
      const w = window as any;
      if (w.Clerk) {
        if (w.Clerk.user) {
          router.replace('/explore');
        } else {
          setReady(true);
        }
        clearInterval(timer);
      }
    }, 200);
    const fallback = setTimeout(() => { clearInterval(timer); setReady(true); }, 3000);
    return () => { clearInterval(timer); clearTimeout(fallback); };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex flex-col items-center justify-center px-5">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-200">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-[26px] font-extrabold text-gray-900">Welcome back</h1>
        <p className="text-[13px] text-gray-500 mt-1">Sign in to ExploreMY</p>
      </div>
      <SignIn routing="hash" />
    </div>
  );
}
