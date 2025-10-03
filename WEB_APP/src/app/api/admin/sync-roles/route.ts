/**
 * POST /api/admin/sync-roles
 * 同步用户角色（从邮箱白名单同步到数据库）
 * 权限：超级管理员
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { adminDb, collections, FieldValue } from '@/lib/firebase-admin';
import { assignRoleByEmail } from '@/lib/permissions';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: '邮箱为必填项' },
        { status: 400 }
      );
    }
    
    // 从白名单获取正确的角色
    const correctRole = assignRoleByEmail(email);
    console.log(`🔄 同步角色: ${email} → ${correctRole}`);
    
    // 更新 students collection
    const studentsSnapshot = await collections.students
      .where('email', '==', email)
      .limit(1)
      .get();
    
    let studentUpdated = false;
    if (!studentsSnapshot.empty) {
      const studentDoc = studentsSnapshot.docs[0];
      await studentDoc.ref.update({
        role: correctRole,
        updatedAt: FieldValue.serverTimestamp(),
      });
      studentUpdated = true;
      console.log(`✅ students collection 已更新: ${email}`);
    }
    
    // 更新 users collection（NextAuth使用）
    const usersCollection = adminDb.collection('users');
    const usersSnapshot = await usersCollection
      .where('email', '==', email)
      .limit(1)
      .get();
    
    let userUpdated = false;
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        role: correctRole,
        updatedAt: FieldValue.serverTimestamp(),
      });
      userUpdated = true;
      console.log(`✅ users collection 已更新: ${email}`);
    }
    
    const message = `角色同步成功: ${email} → ${correctRole} (students: ${studentUpdated}, users: ${userUpdated})`;
    
    return createSuccessResponse(
      {
        email,
        role: correctRole,
        studentUpdated,
        userUpdated,
      },
      message
    );
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to sync role');
  }
}

