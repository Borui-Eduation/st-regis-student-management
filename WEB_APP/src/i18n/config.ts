/**
 * i18n Configuration
 * 国际化配置
 */

export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  zh: '简体中文',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  zh: '🇨🇳',
  en: '🇺🇸',
};

export const localeLabels: Record<Locale, string> = {
  zh: '中文',
  en: 'EN',
};
