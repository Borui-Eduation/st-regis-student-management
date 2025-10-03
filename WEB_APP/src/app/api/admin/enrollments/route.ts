import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createErrorResponse, createSuccessResponse, notFoundError, validationError, conflictError } from '@/lib/api-error-handler';
import { getPriceForCourse } from '@/lib/pricing';
import { tieredCachedFetch, invalidateTieredCacheByPrefix } from '@/lib/cache-tiered';
import { CacheKeys, CACHE_STRATEGY } from '@/lib/cache';
import type { ApiResponse, PaginatedResponse } from '@/types';

/**
 * GET /api/admin/enrollments
 * 获取所有课程注册记录（或按状态筛选）
 * 权限：管理员及以上
 * 查询参数：status (可选) - pending, ready, open, rejected
 * 🚀 已启用两层缓存（内存 + Redis）
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<any>>>> {
  try {
    await requireRole(['admin', 'superadmin']);
    
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all'; // 状态筛选
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    
    // 生成缓存键
    const cacheKey = CacheKeys.enrollments(status, page);
    
    // 使用两层缓存
    const response = await tieredCachedFetch(
      cacheKey,
      async () => {
        // 构建查询
        let query = collections.enrollments.orderBy('createdAt', 'desc');
        
        // 如果指定了状态，则按状态筛选
        if (status && status !== 'all') {
          query = query.where('status', '==', status) as any;
        }
        
        // 执行查询
        console.log(`📊 从Firestore查询 enrollments (status: ${status}, page: ${page})`);
        const snapshot = await query.get();
        
        // 转换数据
        const allEnrollments = snapshot.docs.map(doc => ({
          enrollmentId: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        }));
        
        // 分页
        const total = allEnrollments.length;
        const offset = (page - 1) * pageSize;
        const items = allEnrollments.slice(offset, offset + pageSize);
        
        return {
          items,
          total,
          page,
          pageSize,
          hasMore: offset + pageSize < total,
        } as PaginatedResponse<any>;
      },
      CACHE_STRATEGY.lists  // 🚀 使用列表数据缓存策略
    );
    
    return createSuccessResponse(response, 'Enrollments fetched successfully');
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch enrollments');
  }
}

/**
 * POST /api/admin/enrollments
 * 管理员为学生添加课程注册
 * 权限：管理员及以上
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await requireRole(['admin', 'superadmin']);
    const body = await req.json();
    const { studentId, courseId, status = 'ready' } = body;

    // 验证必填字段
    if (!studentId || !courseId) {
      throw validationError('学生ID和课程ID为必填项');
    }

    // 验证学生是否存在
    const studentDoc = await collections.students.doc(studentId).get();
    if (!studentDoc.exists) {
      throw notFoundError('学生');
    }

    // 验证课程是否存在
    const courseDoc = await collections.courses.doc(courseId).get();
    if (!courseDoc.exists) {
      throw notFoundError('课程');
    }

    const studentData = studentDoc.data();
    const courseData = courseDoc.data();

    // 检查是否已经注册过该课程
    const existingEnrollment = await collections.enrollments
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!existingEnrollment.empty) {
      throw conflictError('该学生已经注册过此课程');
    }

    // 计算课程费用
    const courseFee = getPriceForCourse(courseData?.subject || 'Math');

    // 创建注册记录
    const enrollmentData = {
      studentId,
      studentName: studentData?.name || '',
      studentEmail: studentData?.email || null,
      courseId,
      courseName: courseData?.name || '',
      courseSubject: courseData?.subject || '',
      courseGrade: courseData?.grade || null,
      teacherId: courseData?.teacherId || '',
      teacherName: courseData?.teacherName || '',
      status: status, // ready, pending, or open
      courseFee,
      paid: false,
      paymentStatus: 'unpaid',
      paymentMethod: null,
      paymentDate: null,
      notes: `由管理员 ${session.user.name || session.user.email} 添加`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: session.user.email,
    };

    const docRef = collections.enrollments.doc();
    await docRef.set(enrollmentData);

    // 更新学生的课程计数
    const currentCourses = studentData?.currentCourses || 0;
    await collections.students.doc(studentId).update({
      currentCourses: currentCourses + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 🚀 自动失效相关缓存（两层）
    await invalidateTieredCacheByPrefix('enrollments:');

    return createSuccessResponse(
      {
        enrollmentId: docRef.id,
        ...enrollmentData,
      },
      '课程添加成功'
    );
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to add enrollment');
  }
}

