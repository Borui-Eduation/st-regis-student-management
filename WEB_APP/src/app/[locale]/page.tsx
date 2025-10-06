/**
 * Locale Root Page - Role-based Redirect
 * 根据用户角色重定向到相应的控制台
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function LocaleRootPage() {
  const session = await auth();
  
  // 未登录，重定向到登录页
  if (!session) {
    redirect('/auth/signin');
  }
  
  // 根据角色重定向到相应的控制台
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