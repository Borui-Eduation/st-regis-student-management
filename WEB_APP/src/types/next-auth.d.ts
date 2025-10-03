/**
 * NextAuth v5 Type Definitions
 */

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: 'student' | 'admin' | 'it' | 'superadmin';
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: 'student' | 'admin' | 'it' | 'superadmin';
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: 'student' | 'admin' | 'it' | 'superadmin';
  }
}
