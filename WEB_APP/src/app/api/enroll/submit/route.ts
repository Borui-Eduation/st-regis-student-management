import { NextRequest, NextResponse } from 'next/server';
import { adminDb, collections, FieldValue } from '@/lib/firebase-admin';
import type { CartItem } from '@/types';

/**
 * POST /api/enroll/submit
 * 提交注册申请（从购物车）
 * 
 * 这是高并发入口点：
 * 1. 快速创建 enrollment 记录（status: pending）
 * 2. 发送到 Cloud Tasks 异步处理
 * 3. 立即返回响应（不阻塞）
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, cartItems } = await req.json() as {
      userId: string;
      cartItems: CartItem[];
    };

    // 验证输入
    if (!userId || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: '无效的请求参数' },
        { status: 400 }
      );
    }


    // 获取学生信息
    const studentDoc = await collections.students.doc(userId).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '学生不存在' },
        { status: 404 }
      );
    }

    const student = studentDoc.data();
    const enrollmentIds: string[] = [];
    const batch = adminDb.batch();

    // 批量创建 enrollment 记录（pending 状态）
    for (const item of cartItems) {
      const enrollmentRef = collections.enrollments.doc();
      
      // 获取课程信息以读取开始和结束日期
      const courseDoc = await collections.courses.doc(item.courseId).get();
      const courseData = courseDoc.data();
      
      // 从课程获取日期，如果没有则使用默认值
      const startDate = courseData?.startDate || '2025-09-01';
      const endDate = courseData?.endDate || '2026-01-20';
      
      // 如果是 timestamp 格式，转换为 ISO string
      const formattedStartDate = typeof startDate === 'number' 
        ? new Date(startDate).toISOString().split('T')[0]
        : (typeof startDate === 'string' ? startDate.split('T')[0] : startDate);
      const formattedEndDate = typeof endDate === 'number'
        ? new Date(endDate).toISOString().split('T')[0]
        : (typeof endDate === 'string' ? endDate.split('T')[0] : endDate);
      
      const enrollmentData = {
        enrollmentId: enrollmentRef.id,
        
        // 学生信息
        studentId: userId,
        studentName: student?.name || '',
        studentEmail: student?.email || null,
        
        // 课程信息
        courseId: item.courseId,
        courseName: item.courseName,
        
        // 教师信息
        teacherName: item.teacherName,
        
        // 学期信息
        academicYear: item.academicYear,
        semester: item.semester,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        
        // 初始状态
        status: 'pending' as const,
        
        // 审批历史
        approvalHistory: [{
          status: 'pending' as const,
          timestamp: FieldValue.serverTimestamp(),
          actor: 'system',
          comments: '课程注册申请已提交'
        }],
        
        // 支付信息（待确认）
        payment: {
          paid: false,
          paidAt: null,
          amount: item.price,
          method: 'manual' as const,
        },
        
        // 元数据
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.set(enrollmentRef, enrollmentData);
      enrollmentIds.push(enrollmentRef.id);
    }

    // 更新学生的选课数
    batch.update(collections.students.doc(userId), {
      currentCourses: FieldValue.increment(cartItems.length),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 提交批量写入
    await batch.commit();


    // 注意：Cloud Tasks 暂时禁用（开发环境）
    // 生产环境中可以启用异步处理以支持高并发

    // 立即返回成功响应
    return NextResponse.json({
      success: true,
      message: `成功提交 ${enrollmentIds.length} 门课程注册申请！`,
      data: {
        enrollmentIds,
        count: enrollmentIds.length,
      }
    });

  } catch (error: any) {
    console.error('Enrollment submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '提交失败' },
      { status: 500 }
    );
  }
}

