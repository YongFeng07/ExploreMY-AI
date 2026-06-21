/**
 * ExploreMY i18n Configuration
 *
 * Languages: English (default), Bahasa Malaysia, Chinese (Simplified)
 *
 * Usage:
 *   import { useTranslation } from '@/i18n/use-translation';
 *   const { t } = useTranslation();
 *   t('hero.title') // "Discover Malaysia Like Never Before"
 */

export const LOCALES = ['en', 'ms', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Malaysia',
  zh: '简体中文',
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ms: 'ltr',
  zh: 'ltr',
};

export function getLocaleFromPath(pathname: string): Locale {
  for (const locale of LOCALES) {
    if (pathname.startsWith(`/${locale}`) || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
}
