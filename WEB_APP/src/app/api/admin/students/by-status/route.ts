import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { adminDb, collections } from '@/lib/firebase-admin';
import { tieredCachedFetch } from '@/lib/cache-tiered';
import { CACHE_STRATEGY } from '@/lib/cache';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/students/by-status
 * 按课程状态获取学生列表
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status'); // pending, ready, open, rejected

    if (!status) {
      return NextResponse.json({
        success: false,
        error: '缺少 status 参数'
      }, { status: 400 });
    }

    const data = await tieredCachedFetch(
      `students:by-status:${status}`,
      async () => {
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

        // 获取教师列表，用于过滤
        const teachersSnapshot = await collections.teachers.get();
        const teacherEmails = new Set(teachersSnapshot.docs.map(doc => doc.data().email?.toLowerCase()));

        // 🚀 使用批量查询代替N+1查询
        const studentIds = Array.from(studentIdsSet);
        const students: any[] = [];

        // Firestore 'in' 查询最多支持10个ID
        const batchSize = 10;
        const studentPromises = [] as Promise<any>[];
        for (let i = 0; i < studentIds.length; i += batchSize) {
          const batch = studentIds.slice(i, i + batchSize);
          studentPromises.push(
            collections.students.where('__name__', 'in', batch).get()
          );
        }
        const studentSnapshots = await Promise.all(studentPromises);

        // 构建学生映射
        const studentsMap = new Map();
        studentSnapshots.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            studentsMap.set(doc.id, doc.data());
          });
        });

        // 组装学生数据
        studentIds.forEach(studentId => {
          const studentData = studentsMap.get(studentId);
          if (studentData) {
            const email = studentData?.email?.toLowerCase();
            const role = studentData?.role;
            const isNonStudent = role && ['admin', 'superadmin', 'agent'].includes(role);
            if (!email || teacherEmails.has(email) || isNonStudent) {
              return;
            }
            const enrollments = enrollmentsByStudent.get(studentId) || [];
            students.push({
              studentId,
              name: studentData?.name,
              email: studentData?.email,
              school: studentData?.school,
              currentCourses: studentData?.currentCourses || 0,
              status: studentData?.status,
              enrollmentDate: studentData?.enrollmentDate?.toDate?.()?.toISOString() || null,
              createdAt: studentData?.createdAt?.toDate?.()?.toISOString() || null,
              enrollmentsInStatus: enrollments,
              coursesInStatus: enrollments.length,
            });
          }
        });

        // 排序
        students.sort((a, b) => b.coursesInStatus - a.coursesInStatus);
        return { status, students, total: students.length };
      },
      CACHE_STRATEGY.lists
    );

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error fetching students by status:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取学生列表失败' },
      { status: 500 }
    );
  }
}

