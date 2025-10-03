import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createErrorResponse, createSuccessResponse, notFoundError } from '@/lib/api-error-handler';
import type { ApiResponse, Payment } from '@/types';

/**
 * GET /api/admin/payments/[id]
 * 获取单个支付记录
 * 权限：管理员及以上
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Payment>>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const { id } = await params;
    const paymentDoc = await collections.payments.doc(id).get();

    if (!paymentDoc.exists) {
      throw notFoundError('Payment');
    }

    const payment = {
      paymentId: paymentDoc.id,
      ...(paymentDoc.data() as any),
    };

    return createSuccessResponse(payment);

  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch payment');
  }
}

/**
 * PATCH /api/admin/payments/[id]
 * 更新支付记录（标记为已支付、退款等）
 * 权限：管理员及以上
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await requireRole(['admin', 'superadmin']);

    const { id } = await params;
    const body = await req.json();

    const paymentDoc = await collections.payments.doc(id).get();
    if (!paymentDoc.exists) {
      throw notFoundError('Payment');
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
      processedBy: session.user.email,
    };

    // 允许更新的字段
    if (body.status !== undefined) {
      updateData.status = body.status;

      // 如果标记为已完成，记录支付时间
      if (body.status === 'completed' && !paymentDoc.data()?.paidAt) {
        updateData.paidAt = FieldValue.serverTimestamp();
      }

      // 如果是退款，记录退款信息
      if (body.status === 'refunded') {
        updateData.refundedAt = FieldValue.serverTimestamp();
        if (body.refundReason) {
          updateData.refundReason = body.refundReason;
        }
        if (body.refundAmount) {
          updateData.refundAmount = body.refundAmount;
        }
      }
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.transactionId !== undefined) {
      updateData.transactionId = body.transactionId;
    }

    await collections.payments.doc(id).update(updateData);

    // 如果状态变更为completed，同时更新enrollment中的payment.paid
    if (body.status === 'completed') {
      const paymentData = paymentDoc.data();
      const enrollmentId = paymentData?.enrollmentId;

      if (enrollmentId) {
        await collections.enrollments.doc(enrollmentId).update({
          'payment.paid': true,
          'payment.paidAt': FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return createSuccessResponse({ paymentId: id, ...updateData }, 'Payment updated successfully');

  } catch (error: any) {
    return createErrorResponse(error, 'Failed to update payment');
  }
}


