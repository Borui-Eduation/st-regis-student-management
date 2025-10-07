import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { tieredCachedFetch } from '@/lib/cache-tiered';
import { CACHE_STRATEGY } from '@/lib/cache';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/courses/list
 * 获取所有课程列表（简化版，用于下拉选择）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const courses = await tieredCachedFetch(
      'courses:list:from-enrollments',
      async () => {
        const enrollmentsSnapshot = await collections.enrollments.get();
        const coursesSet = new Set<string>();
        enrollmentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.courseName && data.courseName.trim()) {
            coursesSet.add(data.courseName.trim());
          }
        });
        return Array.from(coursesSet).sort();
      },
      CACHE_STRATEGY.lists
    );

    return NextResponse.json({ success: true, data: courses });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '获取课程列表失败',
        message: 'Failed to fetch courses list'
      },
      { status: 500 }
    );
  }
}

