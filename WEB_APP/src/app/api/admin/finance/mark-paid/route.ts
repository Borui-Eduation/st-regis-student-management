import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/admin/finance/mark-paid
 * 标记注册为已付款
 * 权限：管理员及以上
 */
export async function POST(req: NextRequest) {
  try {
    // 权限检查
    const session = await requireRole(['admin', 'superadmin']);

    const body = await req.json();
    const { 
      enrollmentId, 
      paymentMethod, 
      transactionId, 
      amount 
    } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: 'Missing enrollmentId' },
        { status: 400 }
      );
    }

    // 获取注册记录
    const enrollmentDoc = await collections.enrollments.doc(enrollmentId).get();
    
    if (!enrollmentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const enrollmentData = enrollmentDoc.data();
    const payment = enrollmentData?.payment || {};

    // 更新支付信息
    const updatedPayment = {
      ...payment,
      paid: true,
      paidAt: FieldValue.serverTimestamp(),
      method: paymentMethod || payment.method || 'manual',
      transactionId: transactionId || payment.transactionId,
      amount: amount || payment.finalPrice || payment.amount || 0,
      finalPrice: amount || payment.finalPrice || payment.amount || 0,
    };

    // 更新注册记录
    await collections.enrollments.doc(enrollmentId).update({
      payment: updatedPayment,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 更新学生财务统计
    const studentId = enrollmentData?.studentId;
    if (studentId) {
      const paidAmount = updatedPayment.finalPrice || 0;
      
      await collections.students.doc(studentId).update({
        totalPaid: FieldValue.increment(paidAmount),
        totalOwed: FieldValue.increment(-paidAmount),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: {
        enrollmentId,
        payment: updatedPayment,
        updatedBy: session.user.email,
      },
    });

  } catch (error: any) {
    const isForbidden = error.message?.includes('Forbidden') || error.message?.includes('Unauthorized');
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to mark as paid',
        message: 'Payment update failed'
      },
      { status: isForbidden ? 403 : 500 }
    );
  }
}



