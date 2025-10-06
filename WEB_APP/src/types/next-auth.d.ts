/**
 * NextAuth v5 Type Definitions
 * IT role removed - Moodle integration is now automated
 */

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: 'student' | 'agent' | 'teacher' | 'admin' | 'superadmin';
      agentId?: string;
      teacherId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role?: 'student' | 'agent' | 'teacher' | 'admin' | 'superadmin';
    agentId?: string;
    teacherId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: 'student' | 'agent' | 'teacher' | 'admin' | 'superadmin';
    agentId?: string;
    teacherId?: string;
  }
}