/**
 * Root Page Redirect
 * 根页面重定向到登录页
 */

import { redirect } from '@/i18n/routing';

export default function RootPage() {
  // 使用 i18n 路由重定向到登录页
  redirect('/auth/signin');
}
