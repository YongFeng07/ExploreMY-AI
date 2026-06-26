// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Email verification is handled by Clerk automatically.
 * Redirect to /explore (Clerk will enforce verification if enabled).
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/explore');
  }, [router]);
  return null;
}
