/**
 * /api/superadmin/users
 * 超级管理员用户管理API
 * 权限：仅超级管理员
 * 
 * 🎯 功能：创建和管理系统用户
 * ✅ 支持角色：admin, agent, teacher, superadmin
 * ❌ 不支持角色：student（学生请使用 POST /api/admin/students）
 * 
 * 📋 角色说明：
 * - admin: 管理员，可管理学生、课程、注册等
 * - agent: 中介，可查看和管理自己的学生
 * - teacher: 教师，可查看和管理自己的课程
 * - superadmin: 超级管理员，拥有所有权限
 * 
 * 🔐 默认密码：StRegis2025!
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { getDefaultPasswordHash } from '@/lib/password';
import type { ApiResponse } from '@/types';

/**
 * GET /api/superadmin/users
 * 获取所有用户（包括学生）
 * 
 * Query参数：
 * - includeStudents: 是否包括学生（默认 false）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const searchParams = req.nextUrl.searchParams;
    const includeStudents = searchParams.get('includeStudents') === 'true';
    
    let snapshot;
    
    if (includeStudents) {
      // 获取所有用户（包括学生）
      snapshot = await collections.students.get();
    } else {
      // 只获取系统用户（admin, agent, teacher, superadmin）
      snapshot = await collections.students
        .where('role', 'in', ['admin', 'agent', 'teacher', 'superadmin'])
        .get();
    }
    
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
    if (!['admin', 'agent', 'teacher', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '角色必须是 admin, agent, teacher 或 superadmin' },
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
    
    // 🔐 为所有系统用户设置默认密码
    const hashedPassword = await getDefaultPasswordHash();
    
    // 创建用户
    const userData = {
      name,
      email,
      phone: phone || null,
      role, // admin, agent, teacher, or superadmin
      status: 'active',
      currentCourses: 0,
      hashedPassword, // 设置默认密码哈希
      passwordSetAt: FieldValue.serverTimestamp(),
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
    
    // 如果是teacher，同时在teachers集合中创建记录
    if (role === 'teacher') {
      const teacherData = {
        name,
        email,
        phone: phone || null,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await collections.teachers.doc().set(teacherData);
    }
    
    return createSuccessResponse(
      { id: docRef.id, ...userData },
      `${role === 'admin' ? '管理员' : role === 'agent' ? '中介' : role === 'teacher' ? '教师' : '超级管理员'}创建成功（默认密码：StRegis2025!）`,
      201
    );
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to create user');
  }
}

