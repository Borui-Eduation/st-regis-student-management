/**
 * API Authentication Utilities
 * Updated for NextAuth v5
 */

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { UserRole, hasPermission, ROLE_HIERARCHY } from "./permissions";

/**
 * 获取当前用户的 session（服务端）
 */
export async function getSession() {
  return await auth();
}

/**
 * 检查用户是否已登录
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session || !session.user) {
    throw new Error('Unauthorized: Please sign in');
  }
  
  return session;
}

/**
 * 检查用户角色
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const userRole = session.user.role;
  
  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Forbidden: Role '${userRole}' is not allowed. Required: ${allowedRoles.join(', ')}`);
  }
  
  return session;
}

/**
 * 检查用户权限
 */
export async function requirePermission(permission: keyof ReturnType<typeof hasPermission>) {
  const session = await requireAuth();
  const userRole = session.user.role;
  
  if (!hasPermission(userRole, permission as any)) {
    throw new Error(`Forbidden: You don't have '${permission}' permission`);
  }
  
  return session;
}

/**
 * API 权限保护装饰器
 */
export function withAuth(
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await requireAuth();
      return await handler(req, session);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: error.message.includes('Forbidden') ? 403 : 401 }
      );
    }
  };
}

/**
 * API 角色保护装饰器
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await requireRole(allowedRoles);
      return await handler(req, session);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: error.message.includes('Forbidden') ? 403 : 401 }
      );
    }
  };
}

/**
 * 检查用户是否可以访问某个学生的数据
 * 学生只能访问自己的数据，管理员及以上可以访问所有数据
 */
export async function canAccessStudentData(studentId: string): Promise<boolean> {
  const session = await requireAuth();
  const userRole = session.user.role;
  const userId = session.user.id;
  
  // 超级管理员、IT、管理员可以访问所有数据
  if (ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY.admin) {
    return true;
  }
  
  // 学生只能访问自己的数据
  return userId === studentId;
}

/**
 * 要求用户只能访问自己的数据（学生）或所有数据（管理员+）
 */
export async function requireStudentDataAccess(studentId: string) {
  const hasAccess = await canAccessStudentData(studentId);
  
  if (!hasAccess) {
    throw new Error('Forbidden: You can only access your own data');
  }
  
  return await getSession();
}
