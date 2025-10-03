/**
 * /api/superadmin/users
 * 超级管理员用户管理API
 * 权限：仅超级管理员
 * 
 * 功能：创建和管理系统用户（admin, agent, superadmin）
 * 注意：不涉及普通学生管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

/**
 * GET /api/superadmin/users
 * 获取所有系统用户（排除普通学生）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    // 获取所有用户，只显示admin, agent, superadmin
    const snapshot = await collections.students
      .where('role', 'in', ['admin', 'agent', 'superadmin'])
      .get();
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));
    
    return createSuccessResponse(users, 'Users fetched successfully');
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch users');
  }
}

/**
 * POST /api/superadmin/users
 * 创建系统用户（admin, agent, superadmin）
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const body = await req.json();
    const { name, email, role, phone } = body;
    
    // 验证必填字段
    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: '姓名、邮箱和角色为必填项' },
        { status: 400 }
      );
    }
    
    // 验证角色
    if (!['admin', 'agent', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '角色必须是 admin, agent 或 superadmin' },
        { status: 400 }
      );
    }
    
    // 检查邮箱是否已存在
    const existingUser = await collections.students
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!existingUser.empty) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被使用' },
        { status: 409 }
      );
    }
    
    // 创建用户
    const userData = {
      name,
      email,
      phone: phone || null,
      role, // admin, agent, or superadmin
      status: 'active',
      currentCourses: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    const docRef = collections.students.doc();
    await docRef.set(userData);
    
    // 如果是agent，同时在agents集合中创建记录
    if (role === 'agent') {
      const agentData = {
        name,
        email,
        phone: phone || null,
        status: 'active',
        totalStudents: 0,
        totalRevenue: 0,
        commission: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await collections.agents.doc().set(agentData);
    }
    
    return createSuccessResponse(
      { id: docRef.id, ...userData },
      `${role === 'admin' ? '管理员' : role === 'agent' ? '中介' : '超级管理员'}创建成功`,
      201
    );
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to create user');
  }
}

