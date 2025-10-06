/**
 * Locale Root Page - Role-based Redirect
 * 根据用户角色重定向到相应的控制台
 */

import { redirect } from '@/i18n/routing';
import { auth } from '@/auth';

// 标记为动态渲染（需要访问 session）
export const dynamic = 'force-dynamic';

export default async function LocaleRootPage() {
  const session = await auth();
  
  // 未登录，重定向到登录页（使用 i18n 路由）
  if (!session) {
    redirect('/auth/signin');
  }
  
  // 根据角色重定向到相应的控制台（使用 i18n 路由）
  const role = session.user?.role;
  
  switch (role) {
    case 'student':
      redirect('/student');
    case 'agent':
      redirect('/agent');
    case 'teacher':
      redirect('/teacher');
    case 'admin':
    case 'superadmin':
      redirect('/admin');
    default:
      redirect('/auth/signin');
  }
}