/**
 * POST /api/auth/change-password
 * 修改用户密码
 * 权限：已登录用户
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { verifyPassword, hashPassword } from '@/lib/password';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 验证用户身份
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // 2. 验证输入
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: '新密码至少需要8个字符' },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { success: false, error: '新密码不能与当前密码相同' },
        { status: 400 }
      );
    }

    // 3. 查询用户
    const email = session.user.email.toLowerCase();
    const usersSnapshot = await collections.students
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // 4. 验证当前密码（如果已设置密码）
    if (userData.hashedPassword && currentPassword) {
      const isValid = await verifyPassword(currentPassword, userData.hashedPassword);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: '当前密码错误' },
          { status: 401 }
        );
      }
    }

    // 5. 更新密码
    const hashedPassword = await hashPassword(newPassword);
    await userDoc.ref.update({
      hashedPassword,
      passwordSetAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ 密码已更新: ${email}`);

    return createSuccessResponse(
      { success: true },
      '密码修改成功'
    );

  } catch (error: any) {
    console.error('❌ 修改密码错误:', error);
    return createErrorResponse(error, 'Failed to change password');
  }
}



