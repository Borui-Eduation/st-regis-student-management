import { NextRequest, NextResponse } from 'next/server';
import { collections } from '@/lib/firebase-admin';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/courses/list
 * 获取所有课程列表（简化版，用于下拉选择）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 从enrollments中获取所有不同的课程
    const enrollmentsSnapshot = await collections.enrollments.get();
    
    const coursesSet = new Set<string>();
    
    enrollmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.courseName && data.courseName.trim()) {
        coursesSet.add(data.courseName.trim());
      }
    });
    
    // 转换为数组并排序
    const courses = Array.from(coursesSet).sort();
    
    return NextResponse.json({
      success: true,
      data: courses,
    });

  } catch (error: any) {
    console.error('Error fetching courses list:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取课程列表失败' },
      { status: 500 }
    );
  }
}

