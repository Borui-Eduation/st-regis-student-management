/**
 * Type definitions for i18n
 * 国际化类型定义
 */

import { Locale } from '@/i18n/config';

// 扩展 Next.js 页面参数类型
export type PageProps = {
  params: { locale: Locale };
  searchParams: { [key: string]: string | string[] | undefined };
};

export type LayoutProps = {
  children: React.ReactNode;
  params: { locale: Locale };
};
