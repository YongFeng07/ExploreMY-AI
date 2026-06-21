// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Deprecated Clerk sign-up page.
 * Redirects to the custom JWT register page.
 */
export default function SignUpPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/register');
  }, [router]);
  return null;
}
