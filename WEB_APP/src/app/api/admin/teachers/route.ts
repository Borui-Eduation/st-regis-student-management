import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { tieredCachedFetch } from '@/lib/cache-tiered';
import { CACHE_STRATEGY } from '@/lib/cache';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/teachers
 * 获取所有教师列表（从课程中提取）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const teachers = await tieredCachedFetch(
      'teachers:list:from-enrollments',
      async () => {
        const enrollmentsSnapshot = await collections.enrollments.get();
        const teachersSet = new Set<string>();
        enrollmentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.teacherName && data.teacherName.trim()) {
            teachersSet.add(data.teacherName.trim());
          }
        });
        return Array.from(teachersSet).sort();
      },
      CACHE_STRATEGY.lists
    );

    return NextResponse.json({ success: true, data: teachers });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '获取教师列表失败',
        message: 'Failed to fetch teachers list'
      },
      { status: 500 }
    );
  }
}

