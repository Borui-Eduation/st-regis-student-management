/**
 * Client-side i18n utilities
 * 客户端国际化工具
 */

import { Pathnames, LocalePrefix } from 'next-intl/routing';

export const defaultLocale = 'en' as const;
export const locales = ['en', 'zh'] as const;

export const pathnames: Pathnames<typeof locales> = {
  '/': '/',
  '/admin': '/admin',
};

export const localePrefix: LocalePrefix<typeof locales> = 'always';

export const port = process.env.PORT || 3000;
export const host = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${port}`;

