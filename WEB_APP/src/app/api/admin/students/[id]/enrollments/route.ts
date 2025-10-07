import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { adminDb, collections } from '@/lib/firebase-admin';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/students/[id]/enrollments
 * 获取指定学生的所有注册课程
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);
    const { id: studentId } = await params;

    // 查询该学生的所有注册
    const query = collections.enrollments.where('studentId', '==', studentId);
    const snapshot = await query.get();

    const enrollments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        enrollmentId: doc.id,
        courseName: data.courseName,
        teacherName: data.teacherName,
        status: data.status,
        academicYear: data.academicYear,
        semester: data.semester,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrollments,
    });

  } catch (error: any) {
    console.error('Error fetching student enrollments:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取课程列表失败' },
      { status: 500 }
    );
  }
}

