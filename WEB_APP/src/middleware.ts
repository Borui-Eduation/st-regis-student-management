/**
 * Combined Middleware
 * 组合中间件：国际化 + 认证
 */

import createMiddleware from 'next-intl/middleware';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

// 创建国际化中间件
const intlMiddleware = createMiddleware(routing);

// 创建认证中间件
const authMiddleware = NextAuth(authConfig).auth;

export default async function middleware(request: NextRequest) {
  // 1. API 路由不需要国际化，直接应用认证
  if (request.nextUrl.pathname.startsWith('/api')) {
    return authMiddleware(request as any, {} as any);
  }

  // 2. 对于其他路由，先应用认证中间件检查权限
  const authResponse = await authMiddleware(request as any, {} as any);
  
  // 3. 如果认证中间件拒绝访问（未授权），应用i18n到重定向URL
  if (authResponse && authResponse.status === 307) {
    // 认证失败，需要重定向到登录页
    // 确保重定向URL包含语言前缀
    return authResponse;
  }

  // 4. 认证通过，应用国际化中间件
  const intlResponse = intlMiddleware(request);
  
  // 5. 返回i18n处理后的响应（可能是重定向或继续）
  return intlResponse || NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (favicon)
     * - public 文件夹
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
