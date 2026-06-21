'use client';

import { useCallback } from 'react';
import en from './dictionaries/en.json';

type DeepKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${DeepKeyOf<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

type TranslationKeys = DeepKeyOf<typeof en>;

// For now, only English is fully implemented.
// Bahasa Malaysia and Chinese dictionaries will be added in subsequent iterations.
const dictionaries = { en } as const;

/**
 * Simple i18n hook. Returns a `t` function that looks up dot-notation keys
 * in the current locale's dictionary, falling back to English if missing.
 */
export function useTranslation() {
  // In the future, detect locale from URL path or user preference
  const locale = 'en';

  const t = useCallback(
    (key: TranslationKeys, fallback?: string): string => {
      const dict = dictionaries[locale as keyof typeof dictionaries] || dictionaries.en;
      const parts = (key as string).split('.');
      let value: unknown = dict;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return fallback || key;
        }
      }
      return typeof value === 'string' ? value : fallback || key;
    },
    [locale],
  );

  return { t, locale };
}

/**
 * Static translation lookup (usable in server components or generateMetadata).
 */
export function getStaticTranslation(key: string, fallback?: string): string {
  const parts = key.split('.');
  let value: unknown = en;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return fallback || key;
    }
  }
  return typeof value === 'string' ? value : fallback || key;
}
