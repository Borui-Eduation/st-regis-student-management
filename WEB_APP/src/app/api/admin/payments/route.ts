import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import type { ApiResponse, Payment, PaginatedResponse } from '@/types';

/**
 * GET /api/admin/payments
 * 获取支付记录列表（支持分页和筛选）
 * 权限：管理员及以上
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<Payment>>>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status'); // pending, completed, etc.
    const studentId = searchParams.get('studentId');

    // 构建查询
    let query = collections.payments.orderBy('createdAt', 'desc');

    // 按状态筛选
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    // 按学生筛选
    if (studentId) {
      query = query.where('studentId', '==', studentId) as any;
    }

    const snapshot = await query.get();

    // 转换数据
    let payments = snapshot.docs.map(doc => ({
      paymentId: doc.id,
      ...(doc.data() as any),
    }));

    // 分页
    const total = payments.length;
    const offset = (page - 1) * pageSize;
    payments = payments.slice(offset, offset + pageSize);

    const response: PaginatedResponse<any> = {
      items: payments,
      total,
      page,
      pageSize,
      hasMore: offset + payments.length < total,
    };

    return createSuccessResponse(response);

  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch payments');
  }
}


