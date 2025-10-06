/**
 * PATCH /api/admin/enrollments/[id]/status
 * 更改课程注册状态
 * 权限：超级管理员
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue, Timestamp } from '@/lib/firebase-admin';
import { invalidateEnrollmentsCaches } from '@/lib/cache-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse, EnrollmentStatus } from '@/types';

/**
 * PATCH /api/admin/enrollments/[id]/status
 * 更改课程注册记录的状态
 * 权限：超级管理员
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await requireRole(['superadmin']);
    
    const { id: enrollmentId } = await params;
    
    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: '缺少注册ID' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { status, statusChangeComment } = body;
    
    // 验证状态值
    const validStatuses: EnrollmentStatus[] = ['pending', 'ready', 'open', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值。允许的值: pending, ready, open, rejected' },
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
    
    const enrollmentData = enrollmentDoc.data();
    const oldStatus = enrollmentData?.status;
    
    // 如果状态没有改变，直接返回
    if (oldStatus === status) {
      return NextResponse.json(
        { success: false, error: '状态未发生变化' },
        { status: 400 }
      );
    }
    
    // 准备审批历史记录
    const approvalHistoryEntry = {
      status: status,
      timestamp: Timestamp.now(),
      actor: session.user?.email || 'system',
      comments: statusChangeComment || `状态从 ${oldStatus} 更改为 ${status}`,
    };
    
    // 准备更新数据
    const updateData: any = {
      status: status,
      updatedAt: FieldValue.serverTimestamp(),
      // 添加到审批历史
      approvalHistory: FieldValue.arrayUnion(approvalHistoryEntry),
    };
    
    // 如果更改为 'open' 状态，记录开课时间
    if (status === 'open' && oldStatus !== 'open') {
      updateData.openedAt = FieldValue.serverTimestamp();
    }
    
    // 更新注册记录
    await enrollmentRef.update(updateData);
    
    console.log(`✅ 状态已更改: ${enrollmentId} from ${oldStatus} to ${status}`);
    
    // 清除缓存
    await invalidateEnrollmentsCaches();
    
    return createSuccessResponse(
      { 
        enrollmentId, 
        oldStatus, 
        newStatus: status,
        updated: true 
      },
      `课程状态已从 "${oldStatus}" 更改为 "${status}"`
    );
    
  } catch (error: any) {
    console.error('Failed to change status:', error);
    return createErrorResponse(error, 'Failed to change enrollment status');
  }
}
