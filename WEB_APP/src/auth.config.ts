/**
 * NextAuth v5 Configuration (Edge-Compatible)
 * This config can run in Edge Runtime (for middleware)
 */

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

export const authConfig = {
  // 信任来自环境变量的主机
  trustHost: true,
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL || "admin@borui.org",
    }),
  ],
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // 公开路径
      const publicPaths = ['/auth/signin', '/auth/error', '/api/auth', '/'];
      if (publicPaths.some(p => path === p || path.startsWith(p))) {
        return true;
      }

      // 需要登录
      if (!isLoggedIn) {
        return false;
      }

      // 角色检查
      const role = auth?.user?.role;
      
      if (path.startsWith('/admin') && 
          role !== 'admin' && 
          role !== 'superadmin') {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;



