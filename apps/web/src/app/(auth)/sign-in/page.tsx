// @ts-nocheck
'use client';

import { SignIn } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';

/**
 * Clerk Sign In page.
 * Uses the same /login page content but at the /sign-in route.
 */
export default function SignInPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 via-white to-white flex flex-col items-center justify-center px-5">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">Welcome back</h1>
        <p className="text-[14px] text-gray-500 mt-1">Sign in to your Travel Passport</p>
      </div>
      <div className="w-full max-w-sm">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/explore"
          fallbackRedirectUrl="/explore"
        />
      </div>
    </div>
  );
}
