/**
 * PUT /api/admin/enrollments/[id]
 * 更新课程注册记录（用于更新成绩和评语）
 * 权限：管理员及以上
 * 
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

/**
 * PUT /api/admin/enrollments/[id]
 * 更新课程注册记录的成绩和评语
 * 权限：管理员、教师
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await requireRole(['admin', 'superadmin', 'teacher']);
    
    const { id: enrollmentId } = await params;
    
    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: '缺少注册ID' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { midtermMark, midtermComments, finalGrade, finalComments } = body;
    
    // 验证成绩范围
    if (midtermMark !== null && midtermMark !== undefined) {
      const mark = parseFloat(midtermMark);
      if (isNaN(mark) || mark < 0 || mark > 100) {
        return NextResponse.json(
          { success: false, error: '期中成绩必须在0-100之间' },
          { status: 400 }
        );
      }
    }
    
    if (finalGrade !== null && finalGrade !== undefined) {
      const grade = parseFloat(finalGrade);
      if (isNaN(grade) || grade < 0 || grade > 100) {
        return NextResponse.json(
          { success: false, error: '期末成绩必须在0-100之间' },
          { status: 400 }
        );
      }
    }
    
    const enrollmentRef = collections.enrollments.doc(enrollmentId);
    const enrollmentDoc = await enrollmentRef.get();
    
    if (!enrollmentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '注册记录不存在' },
        { status: 404 }
      );
    }
    
    const enrollmentData = enrollmentDoc.data();
    
    // 🔒 如果是教师，验证该enrollment是否属于该教师的课程
    if (session.user?.role === 'teacher') {
      const teacherEmail = session.user.email;
      
      // 查询教师信息
      const teachersSnapshot = await collections.teachers
        .where('email', '==', teacherEmail)
        .limit(1)
        .get();
      
      if (teachersSnapshot.empty) {
        return NextResponse.json(
          { success: false, error: '教师信息不存在' },
          { status: 404 }
        );
      }
      
      const teacherId = teachersSnapshot.docs[0].id;
      
      // 查询课程信息，验证教师权限
      const courseSnapshot = await collections.courses.doc(enrollmentData?.courseId).get();
      if (!courseSnapshot.exists || courseSnapshot.data()?.teacherId !== teacherId) {
        return NextResponse.json(
          { success: false, error: '无权限修改此课程的成绩' },
          { status: 403 }
        );
      }
    }
    
    // 准备更新数据
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    // 只更新提供的字段
    if (midtermMark !== undefined) {
      updateData.midtermMark = midtermMark;
    }
    if (midtermComments !== undefined) {
      updateData.midtermComments = midtermComments;
    }
    if (finalGrade !== undefined) {
      updateData.finalGrade = finalGrade;
    }
    if (finalComments !== undefined) {
      updateData.finalComments = finalComments;
    }
    
    // 更新注册记录
    await enrollmentRef.update(updateData);
    
    // 清除缓存
    await invalidateEnrollmentsCaches();
    
    return createSuccessResponse(
      { enrollmentId, updated: true },
      '成绩和评语已更新'
    );
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to update enrollment');
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const { id: enrollmentId } = await params;
    
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

