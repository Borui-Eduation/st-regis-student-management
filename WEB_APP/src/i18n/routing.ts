/**
 * i18n Routing Configuration
 * 路由国际化配置
 */

import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  // 支持的语言列表
  locales,
  
  // 默认语言
  defaultLocale,
  
  // URL 策略：默认语言不显示前缀，其他语言显示
  // 例如: /admin (en), /zh/admin (zh)
  localePrefix: 'as-needed',
});

// 导出国际化的导航组件和钩子
export const { Link, redirect, usePathname, useRouter } = 
  createSharedPathnamesNavigation(routing);
