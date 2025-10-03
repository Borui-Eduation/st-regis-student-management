/**
 * NextAuth v5 Configuration (Full - Node.js Runtime)
 * This includes database adapter and runs in Node.js runtime
 */

import NextAuth from "next-auth";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { adminDb, collections } from "./lib/firebase-admin";
import { assignRoleByEmail } from "./lib/permissions";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: FirestoreAdapter(adminDb),
  
  callbacks: {
    ...authConfig.callbacks,
    
    async signIn({ user, account, profile }) {
      try {
        const email = user.email;
        
        if (!email) {
          return false;
        }

        // 检查用户是否存在于 Firestore
        const usersSnapshot = await collections.students
          .where('email', '==', email)
          .limit(1)
          .get();

        let userRole: 'student' | 'admin' | 'it' | 'superadmin' = 'student';
        let userId = user.id;

        if (!usersSnapshot.empty) {
          // 用户已存在 - 使用数据库中的角色
          const userData = usersSnapshot.docs[0].data();
          userRole = (userData.role as any) || 'student';
          userId = usersSnapshot.docs[0].id;
        } else {
          // 新用户 - 根据邮箱白名单分配角色
          userRole = assignRoleByEmail(email);

          // 创建新用户记录
          const newUserRef = collections.students.doc();
          await newUserRef.set({
            studentId: newUserRef.id,
            name: user.name || email.split('@')[0],
            email: email,
            role: userRole,
            status: 'active',
            currentCourses: 0,
            school: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          userId = newUserRef.id;
        }

        // 将角色和ID附加到用户对象
        user.role = userRole;
        user.id = userId;

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      // 初始登录时从数据库查询角色
      if (user?.email) {
        try {
          const usersSnapshot = await collections.students
            .where('email', '==', user.email)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            const dbRole = userData.role || 'student';
            token.id = usersSnapshot.docs[0].id;
            token.role = dbRole;
          } else {
            token.id = user.id;
            token.role = assignRoleByEmail(user.email);
          }
        } catch (error) {
          console.error('Error querying database in JWT callback:', error);
          token.id = user.id;
          token.role = 'student';
        }
      }

      // 处理会话更新
      if (trigger === "update" && session) {
        token.role = session.role;
      }

      return token;
    },

    async session({ session, token }) {
      // 将token中的数据添加到session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'student' | 'admin' | 'it' | 'superadmin';
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  secret: process.env.NEXTAUTH_SECRET,
});
