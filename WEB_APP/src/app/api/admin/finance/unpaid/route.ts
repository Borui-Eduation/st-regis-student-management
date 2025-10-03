import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';

/**
 * GET /api/admin/finance/unpaid
 * 获取未付款注册列表
 * 权限：管理员及以上
 */
export async function GET(req: NextRequest) {
  try {
    // 权限检查
    await requireRole(['admin', 'it', 'superadmin']);

    // 查询未付款的注册
    const enrollmentsSnapshot = await collections.enrollments
      .where('payment.paid', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    const unpaidEnrollments = enrollmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        courseId: data.courseId,
        courseName: data.courseName,
        teacherName: data.teacherName,
        academicYear: data.academicYear,
        semester: data.semester,
        status: data.status,
        payment: data.payment || {
          paid: false,
          amount: 0,
          basePrice: 0,
          finalPrice: 0,
          method: 'unknown',
        },
        createdAt: data.createdAt,
      };
    });

    // 按学生分组统计
    const studentDebts: Record<string, {
      studentId: string;
      studentName: string;
      studentEmail: string;
      totalOwed: number;
      enrollments: any[];
    }> = {};

    unpaidEnrollments.forEach(enrollment => {
      const studentId = enrollment.studentId;
      if (!studentDebts[studentId]) {
        studentDebts[studentId] = {
          studentId: enrollment.studentId,
          studentName: enrollment.studentName,
          studentEmail: enrollment.studentEmail || '',
          totalOwed: 0,
          enrollments: [],
        };
      }
      
      const amount = enrollment.payment.finalPrice || enrollment.payment.amount || 0;
      studentDebts[studentId].totalOwed += amount;
      studentDebts[studentId].enrollments.push(enrollment);
    });

    // 转换为数组并排序
    const debtList = Object.values(studentDebts).sort((a, b) => b.totalOwed - a.totalOwed);

    return NextResponse.json({
      success: true,
      data: {
        unpaidEnrollments,
        studentDebts: debtList,
        summary: {
          totalUnpaid: unpaidEnrollments.reduce((sum, e) => 
            sum + (e.payment.finalPrice || e.payment.amount || 0), 0
          ),
          count: unpaidEnrollments.length,
          studentCount: debtList.length,
        },
      },
    });

  } catch (error: any) {
    console.error('Unpaid enrollments error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get unpaid enrollments' 
      },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

