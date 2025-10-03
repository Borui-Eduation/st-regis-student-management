import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { adminDb, collections, FieldValue } from '@/lib/firebase-admin';
import { invalidateEnrollmentsCaches } from '@/lib/cache-utils';
import type { ApiResponse } from '@/types';

/**
 * POST /api/admin/reject
 * 管理员拒绝注册申请
 * 权限：管理员及以上
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 🔒 权限检查
    const session = await requireRole(['admin', 'superadmin']);
    
    const body = await req.json();
    const { enrollmentId, reason, adminEmail } = body as {
      enrollmentId: string;
      reason: string;
      adminEmail: string;
    };

    if (!enrollmentId || !reason) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
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

    if (enrollment?.status !== 'pending') {
      return NextResponse.json(
        { 
          success: false, 
          error: `无法拒绝：当前状态为 ${enrollment?.status}` 
        },
        { status: 400 }
      );
    }

    // 更新状态
    await enrollmentRef.update({
      status: 'rejected',
      approvalHistory: FieldValue.arrayUnion({
        status: 'rejected',
        timestamp: FieldValue.serverTimestamp(),
        actor: session.user.email || adminEmail || 'admin',
        comments: reason,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 恢复课程计数
    if (enrollment?.courseId) {
      await collections.courses.doc(enrollment.courseId).update({
        currentEnrollment: FieldValue.increment(-1),
      });
    }

    // 🚀 清除相关缓存
    await invalidateEnrollmentsCaches();

    // Firestore Trigger 会自动发送拒绝通知邮件

    return NextResponse.json({
      success: true,
      message: '已拒绝注册，学生通知已发送',
      data: {
        enrollmentId,
        newStatus: 'rejected',
      },
    });

  } catch (error: any) {
    console.error('Rejection error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '拒绝失败' },
      { status: 500 }
    );
  }
}

