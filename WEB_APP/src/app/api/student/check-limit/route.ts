import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { STUDENT_COURSE_LIMITS } from '@/lib/pricing';

/**
 * GET /api/student/check-limit
 * 检查学生是否可以选更多课程
 * 权限：学生本人
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // 获取学生信息
    const studentDoc = await collections.students.doc(userId).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    const currentCourses = studentData?.currentCourses || 0;
    const maxCourses = studentData?.maxCoursesPerSemester || STUDENT_COURSE_LIMITS.maxCoursesPerSemester;

    const canEnroll = currentCourses < maxCourses;
    const remainingSlots = maxCourses - currentCourses;

    return NextResponse.json({
      success: true,
      data: {
        canEnroll,
        currentCourses,
        maxCourses,
        remainingSlots,
        message: canEnroll 
          ? `您还可以选 ${remainingSlots} 门课程`
          : `已达到本学期选课上限（${maxCourses}门）`,
      },
    });

  } catch (error: any) {
    console.error('Check limit error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check course limit' 
      },
      { status: 401 }
    );
  }
}



