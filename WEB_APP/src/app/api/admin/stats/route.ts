import { NextRequest, NextResponse } from 'next/server';
import { adminDb, collections } from '@/lib/firebase-admin';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/stats
 * 获取管理员统计数据
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 并行查询所有统计数据
    const [
      pendingSnapshot,
      readySnapshot,
      openSnapshot,
      rejectedSnapshot,
      allEnrollmentsSnapshot,
    ] = await Promise.all([
      collections.enrollments.where('status', '==', 'pending').count().get(),
      collections.enrollments.where('status', '==', 'ready').count().get(),
      collections.enrollments.where('status', '==', 'open').count().get(),
      collections.enrollments.where('status', '==', 'rejected').count().get(),
      collections.enrollments.get(), // 获取所有注册记录来统计唯一学生和课程
    ]);

    // 统计唯一的学生和课程
    const uniqueStudents = new Set<string>();
    const uniqueCourses = new Set<string>();
    
    allEnrollmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.studentId) {
        uniqueStudents.add(data.studentId);
      }
      if (data.courseId) {
        uniqueCourses.add(data.courseId);
      }
    });

    const stats = {
      enrollments: {
        pending: pendingSnapshot.data().count,
        ready: readySnapshot.data().count,
        open: openSnapshot.data().count,
        rejected: rejectedSnapshot.data().count,
        total: pendingSnapshot.data().count + readySnapshot.data().count + openSnapshot.data().count + rejectedSnapshot.data().count,
      },
      courses: {
        active: uniqueCourses.size, // 实际有注册的课程数
      },
      students: {
        active: uniqueStudents.size, // 实际有注册记录的学生数
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取统计失败' },
      { status: 500 }
    );
  }
}

