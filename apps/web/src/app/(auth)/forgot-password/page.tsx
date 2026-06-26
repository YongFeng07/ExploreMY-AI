// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Forgot password is handled by Clerk's SignIn component.
 * Redirect to /login where users can click "Forgot password?".
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
