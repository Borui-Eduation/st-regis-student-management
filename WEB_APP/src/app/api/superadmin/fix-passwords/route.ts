/**
 * /api/superadmin/fix-passwords
 * 临时修复API：为所有没有密码的系统用户设置默认密码
 * 仅超级管理员可用
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { getDefaultPasswordHash } from '@/lib/password';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

/**
 * POST /api/superadmin/fix-passwords
 * 为所有没有密码的系统用户（admin, agent, teacher, superadmin）设置默认密码
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    console.log('🔧 开始修复用户密码...');
    
    // 获取所有系统用户
    const snapshot = await collections.students
      .where('role', 'in', ['admin', 'agent', 'teacher', 'superadmin'])
      .get();
    
    let fixedCount = 0;
    let skippedCount = 0;
    const fixedUsers = [];
    
    // 生成默认密码哈希
    const hashedPassword = await getDefaultPasswordHash();
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      // 检查是否已有密码
      if (userData.hashedPassword) {
        skippedCount++;
        console.log(`⏭️  跳过 ${userData.email}（已有密码）`);
        continue;
      }
      
      // 更新密码
      await collections.students.doc(userId).update({
        hashedPassword,
        passwordSetAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      fixedCount++;
      fixedUsers.push({
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });
      
      console.log(`✅ 已修复 ${userData.email}（角色：${userData.role}）`);
    }
    
    console.log(`🎉 密码修复完成：修复 ${fixedCount} 个用户，跳过 ${skippedCount} 个用户`);
    
    return createSuccessResponse(
      {
        fixedCount,
        skippedCount,
        fixedUsers,
        defaultPassword: 'StRegis2025!',
      },
      `成功为 ${fixedCount} 个用户设置默认密码`
    );
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fix passwords');
  }
}




