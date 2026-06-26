// @ts-nocheck
'use client';

import { SignUp } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex flex-col items-center justify-center px-5">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">Create Account</h1>
        <p className="text-[14px] text-gray-500 mt-1">Start your travel journey</p>
      </div>
      <div className="w-full max-w-sm">
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          forceRedirectUrl="/onboarding"
          fallbackRedirectUrl="/explore"
        />
      </div>
    </div>
  );
}
