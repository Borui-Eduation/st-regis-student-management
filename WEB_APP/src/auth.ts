/**
 * NextAuth v5 Configuration (Full - Node.js Runtime)
 * 使用 JWT 会话策略，不需要数据库 adapter
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { collections } from "./lib/firebase-admin";
import { assignRoleByEmail } from "./lib/permissions";
import { verifyPassword } from "./lib/password";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  
  // 🔐 添加 Credentials Provider（需要 Node.js runtime）
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ 缺少邮箱或密码');
            return null;
          }

          const email = (credentials.email as string).toLowerCase();
          const password = credentials.password as string;

          // 查询用户
          const usersSnapshot = await collections.students
            .where('email', '==', email)
            .limit(1)
            .get();

          if (usersSnapshot.empty) {
            console.log(`❌ 用户不存在: ${email}`);
            return null;
          }

          const userDoc = usersSnapshot.docs[0];
          const userData = userDoc.data();
          const userRole = userData.role || 'student';

          // 🔒 只允许 admin、superadmin、agent、teacher 登录
          if (userRole === 'student') {
            console.log(`❌ 学生账号不允许登录: ${email}`);
            return null;
          }

          // 检查是否设置了密码
          if (!userData.hashedPassword) {
            console.log(`❌ 用户未设置密码: ${email}`);
            return null;
          }

          // 验证密码
          const isValid = await verifyPassword(password, userData.hashedPassword);
          if (!isValid) {
            console.log(`❌ 密码错误: ${email}`);
            return null;
          }

          console.log(`✅ 密码验证通过: ${email} (角色: ${userRole})`);

          // 返回用户信息
          return {
            id: userDoc.id,
            email: userData.email,
            name: userData.name,
            role: userRole,
          };
        } catch (error) {
          console.error('❌ 密码登录错误:', error);
          return null;
        }
      }
    }),
  ],
  
  // 🚀 使用 JWT 会话策略，不需要数据库 adapter
  // adapter: FirestoreAdapter(adminDb),
  
  callbacks: {
    ...authConfig.callbacks,
    
    async signIn({ user, account, profile }) {
      try {
        const email = user.email;
        
        if (!email) {
          console.log('❌ 拒绝登录：邮箱为空');
          return false;
        }

        // 检查用户是否存在于 Firestore
        const usersSnapshot = await collections.students
          .where('email', '==', email.toLowerCase())
          .limit(1)
          .get();

        // 🔒 安全策略：只允许已存在的用户登录，不自动创建新用户
        if (usersSnapshot.empty) {
          console.log(`❌ 拒绝登录：用户不存在 (${email})`);
          console.log('💡 提示：用户需要先由管理员在系统中创建');
          return false;  // 拒绝登录
        }

        // ✅ 用户已存在 - 允许登录
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;
        const dbRole = userData.role || 'student';
        
        // 🔒 只允许 admin、superadmin、agent、teacher 通过 Google 登录
        // 学生账号不提供任何登录方式
        if (dbRole === 'student') {
          console.log(`❌ 拒绝登录：学生账号不允许登录 (${email})`);
          return false;
        }
        
        console.log(`✅ 用户验证通过: ${email} (角色: ${dbRole})`);

        // 🚀 优先使用邮箱白名单判断角色（保证权限配置是权威来源）
        const roleFromWhitelist = assignRoleByEmail(email);
        
        // 如果白名单中的角色与数据库不同，更新数据库
        if (roleFromWhitelist !== dbRole) {
          console.log(`🔄 更新用户角色: ${email} (${dbRole} → ${roleFromWhitelist})`);
          
          // 更新 students collection
          await collections.students.doc(userId).update({
            role: roleFromWhitelist,
            updatedAt: new Date(),
          });
          
          // 🚀 使用 JWT 会话，不需要同步到 users collection
          // (如果使用数据库会话策略，取消注释下面的代码)
          /*
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
          */
        }

        // 将角色和ID附加到用户对象
        user.role = roleFromWhitelist;
        user.id = userId;

        return true;
      } catch (error) {
        console.error('❌ 登录验证错误:', error);
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
            
            // 🚀 优化：如果是teacher，查询并存储teacherId避免重复查询
            if (roleFromWhitelist === 'teacher') {
              try {
                const teacherSnapshot = await collections.teachers
                  .where('email', '==', user.email)
                  .limit(1)
                  .get();
                
                if (!teacherSnapshot.empty) {
                  token.teacherId = teacherSnapshot.docs[0].id;
                }
              } catch (error) {
                console.error('Failed to fetch teacherId:', error);
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
        session.user.role = token.role as 'student' | 'agent' | 'teacher' | 'admin' | 'superadmin';
        
        // 🚀 优化：传递agentId到session
        if (token.agentId) {
          session.user.agentId = token.agentId as string;
        }
        
        // 🚀 优化：传递teacherId到session
        if (token.teacherId) {
          session.user.teacherId = token.teacherId as string;
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
