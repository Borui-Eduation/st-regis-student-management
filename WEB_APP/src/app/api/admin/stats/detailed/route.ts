import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';

/**
 * GET /api/admin/stats/detailed
 * 获取详细统计数据（按学科、年级、教师等）
 * 权限：管理员及以上
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'it', 'superadmin']);

    // 获取所有课程
    const coursesSnapshot = await collections.courses
      .where('status', '==', 'active')
      .get();
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 获取所有注册
    const enrollmentsSnapshot = await collections.enrollments.get();
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 按学科统计
    const bySubject: Record<string, {
      count: number;
      students: number;
      revenue: number;
    }> = {};

    // 按年级统计
    const byGradeLevel: Record<number, {
      count: number;
      students: number;
      revenue: number;
    }> = {};

    // 按教师统计
    const byTeacher: Record<string, {
      courses: number;
      students: number;
      revenue: number;
    }> = {};

    // 按课程类别统计
    const byCategory: Record<string, {
      count: number;
      students: number;
      revenue: number;
    }> = {};

    // 统计注册数据
    enrollments.forEach((enrollment: any) => {
      // 找到对应的课程
      const course = courses.find((c: any) => c.id === enrollment.courseId);
      if (!course) return;

      const subject = (course as any).subject || 'Unknown';
      const gradeLevel = (course as any).gradeLevel;
      const teacher = enrollment.teacherName || 'Unassigned';
      const category = (course as any).category || 'unknown';
      const payment = enrollment.payment || {};
      const revenue = payment.finalPrice || payment.amount || 0;

      // 按学科
      if (!bySubject[subject]) {
        bySubject[subject] = { count: 0, students: 0, revenue: 0 };
      }
      bySubject[subject].count++;
      bySubject[subject].students++;
      bySubject[subject].revenue += revenue;

      // 按年级
      if (gradeLevel) {
        if (!byGradeLevel[gradeLevel]) {
          byGradeLevel[gradeLevel] = { count: 0, students: 0, revenue: 0 };
        }
        byGradeLevel[gradeLevel].count++;
        byGradeLevel[gradeLevel].students++;
        byGradeLevel[gradeLevel].revenue += revenue;
      }

      // 按教师
      if (!byTeacher[teacher]) {
        byTeacher[teacher] = { courses: 0, students: 0, revenue: 0 };
      }
      byTeacher[teacher].students++;
      byTeacher[teacher].revenue += revenue;

      // 按类别
      if (!byCategory[category]) {
        byCategory[category] = { count: 0, students: 0, revenue: 0 };
      }
      byCategory[category].count++;
      byCategory[category].students++;
      byCategory[category].revenue += revenue;
    });

    // 统计每个教师的课程数
    courses.forEach((course: any) => {
      const teacher = course.teacherName || 'Unassigned';
      if (!byTeacher[teacher]) {
        byTeacher[teacher] = { courses: 0, students: 0, revenue: 0 };
      }
      byTeacher[teacher].courses++;
    });

    // 热门课程排名（按注册人数）
    const popularCourses = courses
      .map((course: any) => ({
        id: course.id,
        name: course.courseName,
        teacher: course.teacherName,
        subject: course.subject,
        enrollment: course.currentEnrollment || 0,
        revenue: enrollments
          .filter((e: any) => e.courseId === course.id)
          .reduce((sum, e: any) => sum + ((e.payment?.finalPrice || e.payment?.amount) || 0), 0),
      }))
      .sort((a, b) => b.enrollment - a.enrollment)
      .slice(0, 10);

    // 转换为数组并格式化
    const formatStats = (obj: Record<string, any>) => 
      Object.entries(obj).map(([key, value]) => ({
        name: key,
        ...value,
      })).sort((a, b) => b.students - a.students);

    return NextResponse.json({
      success: true,
      data: {
        bySubject: formatStats(bySubject),
        byGradeLevel: Object.entries(byGradeLevel).map(([grade, data]) => ({
          grade: parseInt(grade),
          ...data,
        })).sort((a, b) => a.grade - b.grade),
        byTeacher: formatStats(byTeacher),
        byCategory: formatStats(byCategory),
        popularCourses,
        summary: {
          totalSubjects: Object.keys(bySubject).length,
          totalGradeLevels: Object.keys(byGradeLevel).length,
          totalTeachers: Object.keys(byTeacher).length,
          totalCategories: Object.keys(byCategory).length,
        },
      },
    });

  } catch (error: any) {
    console.error('Detailed stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get detailed stats' 
      },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

