import { NextRequest, NextResponse } from 'next/server';
import { adminDb, collections } from '@/lib/firebase-admin';
import type { ApiResponse, Course, PaginatedResponse } from '@/types';

/**
 * GET /api/courses
 * 获取课程列表（支持分页和筛选）
 * 
 * Query 参数:
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20）
 * - academicYear: 学年筛选
 * - semester: 学期筛选
 * - subject: 科目筛选
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<Course>>>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');
    const subject = searchParams.get('subject');

    // 简化查询（避免索引错误）
    let query = collections.courses.where('status', '==', 'active');

    // 获取所有数据（先不用复杂索引）
    const snapshot = await query.get();
    
    // 在内存中过滤和排序
    let courses = snapshot.docs.map(doc => ({
      ...(doc.data() as any),
      courseId: doc.id,
    }));

    // 应用筛选
    if (academicYear) {
      courses = courses.filter(c => c.academicYear === academicYear);
    }
    if (semester) {
      courses = courses.filter(c => c.semester === semester);
    }
    if (subject) {
      courses = courses.filter(c => c.subject === subject);
    }

    // 排序
    courses.sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''));

    // 分页
    const total = courses.length;
    const offset = (page - 1) * pageSize;
    courses = courses.slice(offset, offset + pageSize);

    const response: PaginatedResponse<any> = {
      items: courses,
      total,
      page,
      pageSize,
      hasMore: offset + courses.length < total,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '获取课程列表失败',
        message: 'Failed to fetch courses'
      },
      { status: 500 }
    );
  }
}

