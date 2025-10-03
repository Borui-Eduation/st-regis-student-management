/**
 * DELETE /api/admin/enrollments/[id]
 * 删除课程注册记录
 * 权限：超级管理员
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { invalidateEnrollmentsCaches } from '@/lib/cache-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const enrollmentId = params.id;
    
    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: '缺少注册ID' },
        { status: 400 }
      );
    }
    
    const enrollmentRef = collections.enrollments.doc(enrollmentId);
    const enrollmentDoc = await enrollmentRef.get();
    
    if (!enrollmentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '注册记录不存在' },
        { status: 404 }
      );
    }
    
    const enrollment = enrollmentDoc.data();
    
    // 删除注册记录
    await enrollmentRef.delete();
    
    // 更新学生的课程计数
    if (enrollment?.studentId) {
      try {
        await collections.students.doc(enrollment.studentId).update({
          currentCourses: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to update student course count:', error);
      }
    }
    
    // 恢复课程名额
    if (enrollment?.courseId) {
      try {
        await collections.courses.doc(enrollment.courseId).update({
          currentEnrollment: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to update course enrollment:', error);
      }
    }
    
    // 清除缓存
    await invalidateEnrollmentsCaches();
    
    return createSuccessResponse(
      { enrollmentId, deleted: true },
      '注册记录已删除'
    );
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to delete enrollment');
  }
}

