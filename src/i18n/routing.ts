import { defineRouting } from 'next-intl/routing';

export const locales = ['pt', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, { label: string; flag: string; native: string }> = {
  pt: { label: 'Português', flag: '🇧🇷', native: 'PT' },
  en: { label: 'English', flag: '🇺🇸', native: 'EN' },
  de: { label: 'Deutsch', flag: '🇩🇪', native: 'DE' },
};

export const routing = defineRouting({
  locales,
  defaultLocale: 'pt',
  localePrefix: 'as-needed',
});
