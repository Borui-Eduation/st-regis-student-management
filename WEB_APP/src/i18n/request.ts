/**
 * i18n Request Configuration
 * 用于服务端组件的国际化配置
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // 等待获取 locale
  let locale = await requestLocale;
  
  // 验证语言是否支持
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
