import { NextRequest, NextResponse } from 'next/server';
import { adminDb, collections } from '@/lib/firebase-admin';
import type { ApiResponse, PaginatedResponse } from '@/types';

/**
 * GET /api/it/enrollments/ready
 * 获取待开课的注册列表
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // 查询 ready 状态的注册（先获取所有，再内存排序）
    const query = collections.enrollments.where('status', '==', 'ready');
    const snapshot = await query.get();
    
    // 获取所有数据并在内存中排序
    let allEnrollments = snapshot.docs.map(doc => ({
      ...doc.data(),
      enrollmentId: doc.id,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    // 内存排序（按更新时间倒序）
    allEnrollments.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
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
    console.error('Error fetching ready enrollments:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取失败' },
      { status: 500 }
    );
  }
}

