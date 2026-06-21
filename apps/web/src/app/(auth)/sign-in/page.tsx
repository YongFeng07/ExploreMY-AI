'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Deprecated Clerk sign-in page.
 * Redirects to the custom JWT login page.
 */
export default function SignInPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
