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

  // 2. 对于其他路由，先应用国际化中间件
  const intlResponse = intlMiddleware(request);

  // 3. 如果国际化中间件返回了重定向（比如添加语言前缀），直接返回
  if (intlResponse && (intlResponse.status === 302 || intlResponse.status === 307)) {
    return intlResponse;
  }

  // 4. 然后应用认证中间件
  return authMiddleware(request as any, {} as any);
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
