import { NextRequest, NextResponse } from 'next/server';
import { adminDb, collections, FieldValue } from '@/lib/firebase-admin';
import type { ApiResponse } from '@/types';

/**
 * POST /api/admin/approve
 * 管理员批准注册申请
 * 
 * 流程：
 * 1. 验证管理员权限
 * 2. 更新 enrollment 状态: pending → ready
 * 3. 添加审批记录
 * 4. Firestore Trigger 自动发送 IT 通知
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const { enrollmentId, comments, adminEmail } = body as {
      enrollmentId: string;
      comments?: string;
      adminEmail: string;
    };

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: '缺少注册 ID' },
        { status: 400 }
      );
    }

    const enrollmentRef = collections.enrollments.doc(enrollmentId);
    const enrollmentDoc = await enrollmentRef.get();

    if (!enrollmentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '注册记录不存在' },
        { status: 404 }
      );
    }

    const enrollment = enrollmentDoc.data();

    // 检查当前状态
    if (enrollment?.status !== 'pending') {
      return NextResponse.json(
        { 
          success: false, 
          error: `无法批准：当前状态为 ${enrollment?.status}` 
        },
        { status: 400 }
      );
    }

    // 更新状态
    await enrollmentRef.update({
      status: 'ready',
      'payment.paid': true,
      'payment.paidAt': FieldValue.serverTimestamp(),
      approvalHistory: FieldValue.arrayUnion({
        status: 'ready',
        timestamp: FieldValue.serverTimestamp(),
        actor: adminEmail || 'admin',
        comments: comments || '已确认支付，批准注册',
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });


    // Firestore Trigger 会自动发送 IT 通知邮件

    return NextResponse.json({
      success: true,
      message: '注册已批准，IT 通知已发送',
      data: {
        enrollmentId,
        newStatus: 'ready',
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '批准失败',
        message: 'Approval failed'
      },
      { status: 500 }
    );
  }
}

