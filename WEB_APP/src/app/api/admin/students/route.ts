import { NextRequest, NextResponse } from 'next/server';
import { adminDb, collections } from '@/lib/firebase-admin';
import type { ApiResponse, PaginatedResponse } from '@/types';

/**
 * GET /api/admin/students
 * 获取所有学生列表（分页）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // 查询学生
    let query = collections.students;
    
    // 状态筛选
    if (status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    
    // 获取所有数据
    const allStudentsPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const studentId = doc.id;
      
      // 获取该学生的所有课程注册
      const enrollmentsSnapshot = await collections.enrollments
        .where('studentId', '==', studentId)
        .get();
      
      const enrollments = enrollmentsSnapshot.docs.map(eDoc => {
        const eData = eDoc.data();
        return {
          enrollmentId: eDoc.id,
          courseName: eData.courseName,
          teacherName: eData.teacherName,
          status: eData.status,
        };
      });
      
      return {
        ...data,
        studentId,
        enrollmentDate: data.enrollmentDate?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        enrollments, // 添加课程列表
      };
    });
    
    let allStudents = await Promise.all(allStudentsPromises);

    // 搜索过滤（内存中）
    if (search) {
      const searchLower = search.toLowerCase();
      allStudents = allStudents.filter(student => {
        // 基本信息搜索
        const studentData = student as any;
        const basicMatch = 
          studentData.name?.toLowerCase().includes(searchLower) ||
          studentData.email?.toLowerCase().includes(searchLower) ||
          studentData.phoneNumber?.includes(search) ||
          studentData.studentId?.toLowerCase().includes(searchLower);
        
        // 课程和教师搜索
        const courseMatch = student.enrollments?.some((e: any) =>
          e.courseName?.toLowerCase().includes(searchLower) ||
          e.teacherName?.toLowerCase().includes(searchLower)
        );
        
        return basicMatch || courseMatch;
      });
    }

    // 排序（按创建时间倒序）
    allStudents.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // 分页
    const total = allStudents.length;
    const offset = (page - 1) * pageSize;
    const items = allStudents.slice(offset, offset + pageSize);

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
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: error.message || '获取学生列表失败' },
      { status: 500 }
    );
  }
}

