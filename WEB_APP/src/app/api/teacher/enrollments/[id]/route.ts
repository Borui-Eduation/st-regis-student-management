/**
 * GET /api/teacher/enrollments/[id]
 * 获取单个课程注册记录详情
 * 权限：教师、管理员及以上
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { tieredCachedFetch } from '@/lib/cache-tiered';
import { CACHE_STRATEGY } from '@/lib/cache';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse, Enrollment } from '@/types';

/**
 * GET /api/teacher/enrollments/[id]
 * 获取课程注册记录详情
 * 权限：教师、管理员
 * 🚀 已优化：使用两层缓存
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await requireRole(['teacher', 'admin', 'superadmin']);
    
    const { id: enrollmentId } = await params;
    
    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: '缺少注册ID' },
        { status: 400 }
      );
    }
    
    // 使用缓存获取数据
    const cacheKey = `enrollment:${enrollmentId}`;
    const enrollment = await tieredCachedFetch(
      cacheKey,
      async () => {
        console.log(`📊 从Firestore查询: ${cacheKey}`);
        const enrollmentDoc = await collections.enrollments.doc(enrollmentId).get();
        
        if (!enrollmentDoc.exists) {
          return null;
        }
        
        return {
          enrollmentId: enrollmentDoc.id,
          ...enrollmentDoc.data()
        } as Enrollment;
      },
      CACHE_STRATEGY.profiles
    );
    
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: '注册记录不存在' },
        { status: 404 }
      );
    }
    
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
      const courseSnapshot = await collections.courses.doc(enrollment.courseId).get();
      if (!courseSnapshot.exists || courseSnapshot.data()?.teacherId !== teacherId) {
        return NextResponse.json(
          { success: false, error: '无权限查看此课程信息' },
          { status: 403 }
        );
      }
    }
    
    return createSuccessResponse(enrollment, 'Enrollment fetched successfully');
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch enrollment');
  }
}
