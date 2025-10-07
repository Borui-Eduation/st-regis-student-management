/**
 * /api/superadmin/users/[id]
 * 超级管理员用户管理API - 单个用户操作
 * 权限：仅超级管理员
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

/**
 * DELETE /api/superadmin/users/[id]
 * 删除系统用户
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const { id: userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }
    
    const userDoc = await collections.students.doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    const role = userData?.role;
    
    // 只能删除系统用户（admin, agent, teacher, superadmin），不能删除学生
    if (!role || !['admin', 'agent', 'teacher', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '只能删除系统用户（admin/agent/teacher/superadmin）' },
        { status: 400 }
      );
    }
    
    // 如果是agent，同时删除agents集合中的记录
    if (role === 'agent' && userData?.email) {
      try {
        const agentSnapshot = await collections.agents
          .where('email', '==', userData.email)
          .limit(1)
          .get();
        
        if (!agentSnapshot.empty) {
          await agentSnapshot.docs[0].ref.delete();
        }
      } catch (error) {
        console.error('Failed to delete agent record:', error);
      }
    }
    
    // 如果是teacher，同时删除teachers集合中的记录
    if (role === 'teacher' && userData?.email) {
      try {
        const teacherSnapshot = await collections.teachers
          .where('email', '==', userData.email)
          .limit(1)
          .get();
        
        if (!teacherSnapshot.empty) {
          await teacherSnapshot.docs[0].ref.delete();
        }
      } catch (error) {
        console.error('Failed to delete teacher record:', error);
      }
    }
    
    // 删除用户
    await collections.students.doc(userId).delete();
    
    return createSuccessResponse(
      { userId, deleted: true },
      '用户已删除'
    );
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to delete user');
  }
}

/**
 * PUT /api/superadmin/users/[id]
 * 更新用户信息和角色
 * 
 * 🔄 支持角色转换：
 * - student -> agent/teacher/admin/superadmin
 * - agent/teacher/admin/superadmin -> student
 * - 任意系统角色之间互转
 * 
 * 🚀 自动处理副作用：
 * - student -> agent: 在 agents 集合创建记录
 * - student -> teacher: 在 teachers 集合创建记录
 * - agent -> student/其他: 删除 agents 集合记录
 * - teacher -> student/其他: 删除 teachers 集合记录
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const { id: userId } = await params;
    const body = await req.json();
    const { name, email, phone, role, status } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }
    
    const userDoc = await collections.students.doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    const currentData = userDoc.data();
    const currentRole = currentData?.role || 'student';
    const newRole = role || currentRole;
    
    // 验证新角色
    if (role && !['student', 'admin', 'agent', 'teacher', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '角色必须是 student, admin, agent, teacher 或 superadmin' },
        { status: 400 }
      );
    }
    
    // 🔄 处理角色转换的副作用
    if (role && currentRole !== newRole) {
      console.log(`🔄 角色转换: ${currentData?.email} ${currentRole} -> ${newRole}`);
      
      // 从 agent 转出：删除 agents 集合记录
      if (currentRole === 'agent' && newRole !== 'agent') {
        try {
          const agentSnapshot = await collections.agents
            .where('email', '==', currentData?.email)
            .limit(1)
            .get();
          
          if (!agentSnapshot.empty) {
            await agentSnapshot.docs[0].ref.delete();
            console.log(`✅ 已删除 agents 集合记录: ${currentData?.email}`);
          }
        } catch (error) {
          console.error('Failed to delete agent record:', error);
        }
      }
      
      // 从 teacher 转出：删除 teachers 集合记录
      if (currentRole === 'teacher' && newRole !== 'teacher') {
        try {
          const teacherSnapshot = await collections.teachers
            .where('email', '==', currentData?.email)
            .limit(1)
            .get();
          
          if (!teacherSnapshot.empty) {
            await teacherSnapshot.docs[0].ref.delete();
            console.log(`✅ 已删除 teachers 集合记录: ${currentData?.email}`);
          }
        } catch (error) {
          console.error('Failed to delete teacher record:', error);
        }
      }
      
      // 转为 agent：创建 agents 集合记录
      if (newRole === 'agent' && currentRole !== 'agent') {
        try {
          const agentData = {
            name: name || currentData?.name,
            email: email || currentData?.email,
            phone: phone || currentData?.phone || null,
            status: status || currentData?.status || 'active',
            totalStudents: 0,
            totalRevenue: 0,
            commission: 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };
          
          await collections.agents.doc().set(agentData);
          console.log(`✅ 已创建 agents 集合记录: ${agentData.email}`);
        } catch (error) {
          console.error('Failed to create agent record:', error);
        }
      }
      
      // 转为 teacher：创建 teachers 集合记录
      if (newRole === 'teacher' && currentRole !== 'teacher') {
        try {
          const teacherData = {
            name: name || currentData?.name,
            email: email || currentData?.email,
            phone: phone || currentData?.phone || null,
            status: status || currentData?.status || 'active',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };
          
          await collections.teachers.doc().set(teacherData);
          console.log(`✅ 已创建 teachers 集合记录: ${teacherData.email}`);
        } catch (error) {
          console.error('Failed to create teacher record:', error);
        }
      }
    }
    
    // 更新数据
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    await collections.students.doc(userId).update(updateData);
    
    return createSuccessResponse(
      { userId, ...updateData, roleChanged: currentRole !== newRole },
      `用户已更新${currentRole !== newRole ? '（角色已变更：' + currentRole + ' → ' + newRole + '）' : ''}`
    );
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to update user');
  }
}

