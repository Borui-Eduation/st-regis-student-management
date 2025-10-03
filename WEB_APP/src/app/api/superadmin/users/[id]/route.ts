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
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const userId = params.id;
    
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
    
    // 只能删除系统用户（admin, agent, superadmin），不能删除学生
    if (!role || !['admin', 'agent', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '只能删除系统用户（admin/agent/superadmin）' },
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
 * 更新系统用户
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const userId = params.id;
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
    
    // 只能修改系统用户
    if (!currentData?.role || !['admin', 'agent', 'superadmin'].includes(currentData.role)) {
      return NextResponse.json(
        { success: false, error: '只能修改系统用户' },
        { status: 400 }
      );
    }
    
    // 验证新角色
    if (role && !['admin', 'agent', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '角色必须是 admin, agent 或 superadmin' },
        { status: 400 }
      );
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
      { userId, ...updateData },
      '用户已更新'
    );
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to update user');
  }
}

