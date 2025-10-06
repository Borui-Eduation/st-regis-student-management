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
  
  // URL 策略：始终显示语言前缀
  // 例如: /en/admin, /zh/admin
  // 使用 'always' 以匹配 app/[locale] 文件结构
  localePrefix: 'always',
});

// 导出国际化的导航组件和钩子
export const { Link, redirect, usePathname, useRouter } = 
  createSharedPathnamesNavigation(routing);
