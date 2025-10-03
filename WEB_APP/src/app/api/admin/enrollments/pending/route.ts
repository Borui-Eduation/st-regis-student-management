import { NextRequest, NextResponse } from 'next/server';
import { adminDb, collections } from '@/lib/firebase-admin';
import type { ApiResponse, PaginatedResponse } from '@/types';

/**
 * GET /api/admin/enrollments/pending
 * 获取待审批的注册列表
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // 查询 pending 状态的注册（先获取所有，再内存排序）
    const query = collections.enrollments.where('status', '==', 'pending');
    const snapshot = await query.get();
    
    // 获取所有数据并在内存中排序
    let allEnrollments = snapshot.docs.map(doc => ({
      ...doc.data(),
      enrollmentId: doc.id,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    // 内存排序（按创建时间倒序）
    allEnrollments.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // 分页
    const total = allEnrollments.length;
    const offset = (page - 1) * pageSize;
    const items = allEnrollments.slice(offset, offset + pageSize);

    const response: PaginatedResponse<any> = {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '获取失败',
        message: 'Failed to fetch pending enrollments'
      },
      { status: 500 }
    );
  }
}

