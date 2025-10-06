/**
 * Root Page Redirect
 * 根页面重定向到登录页
 */

import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default function RootPage() {
  // 重定向到登录页
  redirect(`/${defaultLocale}/auth/signin`);
}
