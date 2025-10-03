import { NextRequest, NextResponse } from 'next/server';
import { collections } from '@/lib/firebase-admin';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/teachers
 * 获取所有教师列表（从课程中提取）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 从enrollments中获取所有不同的教师
    const enrollmentsSnapshot = await collections.enrollments.get();
    
    const teachersSet = new Set<string>();
    
    enrollmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.teacherName && data.teacherName.trim()) {
        teachersSet.add(data.teacherName.trim());
      }
    });
    
    // 转换为数组并排序
    const teachers = Array.from(teachersSet).sort();
    
    return NextResponse.json({
      success: true,
      data: teachers,
    });

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

