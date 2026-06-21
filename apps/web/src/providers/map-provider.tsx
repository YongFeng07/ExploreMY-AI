'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { type ReactNode } from 'react';

export function MapProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={['places', 'geometry', 'routes']}
      region="MY"
      language="en"
    >
      {children}
    </APIProvider>
  );
}
