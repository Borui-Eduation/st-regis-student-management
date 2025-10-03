import { NextRequest, NextResponse } from 'next/server';
import { adminDb, collections } from '@/lib/firebase-admin';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/students/by-status
 * 按课程状态获取学生列表
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status'); // pending, ready, open, rejected

    if (!status) {
      return NextResponse.json({
        success: false,
        error: '缺少 status 参数'
      }, { status: 400 });
    }

    // 获取指定状态的所有注册记录
    const enrollmentsQuery = collections.enrollments.where('status', '==', status);
    const enrollmentsSnapshot = await enrollmentsQuery.get();

    // 收集所有学生ID（去重）
    const studentIdsSet = new Set<string>();
    const enrollmentsByStudent = new Map<string, any[]>();

    enrollmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const studentId = data.studentId;
      
      if (studentId) {
        studentIdsSet.add(studentId);
        
        if (!enrollmentsByStudent.has(studentId)) {
          enrollmentsByStudent.set(studentId, []);
        }
        
        enrollmentsByStudent.get(studentId)?.push({
          enrollmentId: doc.id,
          courseName: data.courseName,
          teacherName: data.teacherName,
          status: data.status,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        });
      }
    });

    // 获取这些学生的详细信息
    const studentIds = Array.from(studentIdsSet);
    const students = [];

    for (const studentId of studentIds) {
      const studentDoc = await collections.students.doc(studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        const enrollments = enrollmentsByStudent.get(studentId) || [];
        
        students.push({
          studentId: studentDoc.id,
          name: studentData?.name,
          email: studentData?.email,
          school: studentData?.school,
          currentCourses: studentData?.currentCourses || 0,
          status: studentData?.status,
          enrollmentDate: studentData?.enrollmentDate?.toDate?.()?.toISOString() || null,
          createdAt: studentData?.createdAt?.toDate?.()?.toISOString() || null,
          // 该状态下的课程列表
          enrollmentsInStatus: enrollments,
          // 该状态下的课程数量
          coursesInStatus: enrollments.length,
        });
      }
    }

    // 按课程数量排序（该状态下的课程多的排前面）
    students.sort((a, b) => b.coursesInStatus - a.coursesInStatus);

    return NextResponse.json({
      success: true,
      data: {
        status,
        students,
        total: students.length,
      }
    });

  } catch (error: any) {
    console.error('Error fetching students by status:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取学生列表失败' },
      { status: 500 }
    );
  }
}

