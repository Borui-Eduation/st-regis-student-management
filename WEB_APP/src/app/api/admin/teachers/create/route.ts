import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createErrorResponse, createSuccessResponse, validationError, conflictError } from '@/lib/api-error-handler';
import type { ApiResponse, Teacher } from '@/types';

/**
 * POST /api/admin/teachers/create
 * 创建新教师
 * 权限：管理员及以上
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Teacher>>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const body = await req.json();
    const { name, email, phone, department, specialization, bio } = body;

    // 验证必填字段
    if (!name) {
      throw validationError('教师姓名为必填项');
    }

    if (!email) {
      throw validationError('教师邮箱为必填项');
    }

    // 检查邮箱是否已存在
    const existingTeacher = await collections.teachers
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingTeacher.empty) {
      throw conflictError('该邮箱已被其他教师使用');
    }

    // 创建教师记录
    const teacherData = {
      name,
      email,
      phone: phone || null,
      department: department || null,
      specialization: Array.isArray(specialization) ? specialization : [],
      bio: bio || null,
      status: 'active' as const,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = collections.teachers.doc();
    await docRef.set(teacherData);

    return createSuccessResponse(
      {
        teacherId: docRef.id,
        ...teacherData,
      } as any,
      '教师创建成功'
    );

  } catch (error: any) {
    return createErrorResponse(error, 'Failed to create teacher');
  }
}


