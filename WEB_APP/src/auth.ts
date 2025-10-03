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

        // 🚀 优先使用邮箱白名单判断角色（保证权限配置是权威来源）
        const roleFromWhitelist = assignRoleByEmail(email);
        let userId = user.id;

        if (!usersSnapshot.empty) {
          // 用户已存在 - 检查角色是否需要更新
          const userDoc = usersSnapshot.docs[0];
          const userData = userDoc.data();
          const dbRole = userData.role || 'student';
          userId = userDoc.id;
          
          // 如果白名单中的角色与数据库不同，更新数据库
          if (roleFromWhitelist !== dbRole) {
            console.log(`🔄 更新用户角色: ${email} (${dbRole} → ${roleFromWhitelist})`);
            
            // 更新 students collection
            await collections.students.doc(userId).update({
              role: roleFromWhitelist,
              updatedAt: new Date(),
            });
            
            // 🚀 同时更新 users collection（NextAuth使用）
            try {
              const usersCollection = adminDb.collection('users');
              const authUserSnapshot = await usersCollection
                .where('email', '==', email)
                .limit(1)
                .get();
              
              if (!authUserSnapshot.empty) {
                await authUserSnapshot.docs[0].ref.update({
                  role: roleFromWhitelist,
                  updatedAt: new Date(),
                });
                console.log(`✅ users collection 已同步: ${email} → ${roleFromWhitelist}`);
              }
            } catch (error) {
              console.error('更新users collection失败:', error);
            }
          }
        } else {
          // 新用户 - 根据邮箱白名单分配角色
          const newUserRef = collections.students.doc();
          await newUserRef.set({
            studentId: newUserRef.id,
            name: user.name || email.split('@')[0],
            email: email,
            role: roleFromWhitelist,
            status: 'active',
            currentCourses: 0,
            school: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          userId = newUserRef.id;
          console.log(`✅ 新用户创建: ${email} (角色: ${roleFromWhitelist})`);
        }

        // 使用白名单中的角色
        const userRole = roleFromWhitelist;

        // 将角色和ID附加到用户对象
        user.role = userRole;
        user.id = userId;

        return true;
      } catch (error) {
        // Sign-in error - deny access
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      // 初始登录时从数据库查询角色
      if (user?.email) {
        try {
          // 🚀 优先使用邮箱白名单判断角色
          const roleFromWhitelist = assignRoleByEmail(user.email);
          
          const usersSnapshot = await collections.students
            .where('email', '==', user.email)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            token.id = usersSnapshot.docs[0].id;
            token.role = roleFromWhitelist; // 使用白名单角色
            
            // 🚀 优化：如果是agent，查询并存储agentId避免重复查询
            if (roleFromWhitelist === 'agent') {
              try {
                const agentSnapshot = await collections.agents
                  .where('email', '==', user.email)
                  .limit(1)
                  .get();
                
                if (!agentSnapshot.empty) {
                  token.agentId = agentSnapshot.docs[0].id;
                }
              } catch (error) {
                console.error('Failed to fetch agentId:', error);
              }
            }
          } else {
            token.id = user.id;
            token.role = roleFromWhitelist; // 使用白名单角色
          }
        } catch (error) {
          // Database query failed - use whitelist role
          token.id = user.id;
          token.role = assignRoleByEmail(user.email);
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
        session.user.role = token.role as 'student' | 'admin' | 'superadmin';
        
        // 🚀 优化：传递agentId到session
        if (token.agentId) {
          session.user.agentId = token.agentId as string;
        }
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
