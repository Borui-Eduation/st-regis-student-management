/**
 * GET /api/teacher/enrollments
 * 获取教师自己的课程注册记录
 * 权限：Teacher
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { collections } from '@/lib/firebase-admin';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: '无权限访问' },
        { status: 403 }
      );
    }

    const teacherEmail = session.user.email;

    // 1. 查询教师信息
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

    const teacherDoc = teachersSnapshot.docs[0];
    const teacherData = teacherDoc.data();
    const teacherId = teacherDoc.id;
    const teacherName = teacherData.name;

    console.log(`📚 查询教师课程: ${teacherName} (${teacherEmail})`);

    // 2. 查询该教师的所有课程
    const coursesSnapshot = await collections.courses
      .where('teacherId', '==', teacherId)
      .get();

    if (coursesSnapshot.empty) {
      return createSuccessResponse({
        enrollments: [],
        teacherInfo: {
          teacherId,
          teacherName,
          totalCourses: 0,
          totalStudents: 0,
        }
      }, '暂无课程');
    }

    const courseIds = coursesSnapshot.docs.map(doc => doc.id);
    console.log(`📝 找到 ${courseIds.length} 门课程`);

    // 3. 查询这些课程的所有注册记录
    const enrollments: any[] = [];
    
    // Firestore 'in' 查询最多支持10个值，需要分批
    const batchSize = 10;
    for (let i = 0; i < courseIds.length; i += batchSize) {
      const batch = courseIds.slice(i, i + batchSize);
      const enrollmentsSnapshot = await collections.enrollments
        .where('courseId', 'in', batch)
        .orderBy('createdAt', 'desc')
        .get();
      
      enrollmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        enrollments.push({
          enrollmentId: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        });
      });
    }

    console.log(`👥 找到 ${enrollments.length} 条注册记录`);

    // 4. 统计信息
    const uniqueStudents = new Set(enrollments.map(e => e.studentId));
    
    return createSuccessResponse({
      enrollments,
      teacherInfo: {
        teacherId,
        teacherName,
        totalCourses: courseIds.length,
        totalStudents: uniqueStudents.size,
      }
    }, 'Enrollments fetched successfully');

  } catch (error: any) {
    console.error('❌ 获取教师课程失败:', error);
    return createErrorResponse(error, 'Failed to fetch teacher enrollments');
  }
}

