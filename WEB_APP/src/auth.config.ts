/**
 * NextAuth v5 Configuration (Edge-Compatible)
 * This config can run in Edge Runtime (for middleware)
 */

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  // 信任来自环境变量的主机
  trustHost: true,
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Credentials provider 在 auth.ts 中配置（需要 Node.js runtime）
  ],
  
  pages: {
    signIn: "/en/auth/signin",  // 使用完整路径（包含语言前缀）
    error: "/en/auth/error",
    verifyRequest: "/en/auth/verify-request",
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // 调试信息
      console.log('🔍 Auth Check:', {
        path,
        isLoggedIn,
        userEmail: auth?.user?.email,
        userRole: auth?.user?.role,
      });

      // 公开路径（去除语言前缀后的路径）
      const pathWithoutLocale = path.replace(/^\/(en|zh)/, '');
      const publicPaths = ['/auth/signin', '/auth/error', '/auth/verify-request', '/api/auth', '/api/health', '/about'];
      
      // 允许访问公开路径
      if (publicPaths.some(p => pathWithoutLocale === p || pathWithoutLocale.startsWith(p))) {
        console.log('✅ Public path allowed:', pathWithoutLocale);
        return true;
      }
      
      // 允许访问根路径（用于角色重定向）
      if (path === '/' || pathWithoutLocale === '/' || path.match(/^\/(en|zh)\/?$/)) {
        console.log('✅ Root path allowed');
        return true;
      }

      // 需要登录
      if (!isLoggedIn) {
        console.log('❌ Not logged in, redirecting to signin');
        return false;
      }

      // 角色检查
      const role = auth?.user?.role;
      
      if (pathWithoutLocale.startsWith('/admin') && 
          role !== 'admin' && 
          role !== 'superadmin') {
        return false;
      }
      
      if (pathWithoutLocale.startsWith('/superadmin') && role !== 'superadmin') {
        return false;
      }
      
      if (pathWithoutLocale.startsWith('/teacher') && role !== 'teacher') {
        return false;
      }
      
      if (pathWithoutLocale.startsWith('/agent') && role !== 'agent') {
        return false;
      }
      
      if (pathWithoutLocale.startsWith('/student') && role !== 'student') {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;



