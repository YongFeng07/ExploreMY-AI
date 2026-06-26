// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Password reset is handled by Clerk.
 * The Clerk SignIn component includes the full reset password flow.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
