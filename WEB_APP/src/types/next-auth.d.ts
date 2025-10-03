/**
 * NextAuth v5 Type Definitions
 * IT role removed - Moodle integration is now automated
 */

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: 'student' | 'agent' | 'admin' | 'superadmin';
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: 'student' | 'agent' | 'admin' | 'superadmin';
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: 'student' | 'agent' | 'admin' | 'superadmin';
  }
}
