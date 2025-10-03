import { NextRequest, NextResponse } from 'next/server';
// import { createMoodleEnrollmentTask } from '@/lib/cloud-tasks'; // 暂时禁用 Cloud Tasks
import { adminDb, collections } from '@/lib/firebase-admin';
import type { ApiResponse, MoodleTaskPayload } from '@/types';

/**
 * POST /api/it/open-course
 * IT 开课（发送到 Moodle 队列）
 * 
 * 流程：
 * 1. 验证 IT 权限
 * 2. 检查状态是否为 'ready'
 * 3. 发送到 Moodle 队列处理
 * 4. 立即返回（异步处理）
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // TODO: 添加 IT 权限验证
    // const token = req.headers.get('authorization')?.replace('Bearer ', '');
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // if (decodedToken.role !== 'it') {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    // }

    const body = await req.json();
    const { enrollmentId } = body as { enrollmentId: string };

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: '缺少注册 ID' },
        { status: 400 }
      );
    }

    // 获取 enrollment 信息
    const enrollmentDoc = await collections.enrollments.doc(enrollmentId).get();

    if (!enrollmentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '注册记录不存在' },
        { status: 404 }
      );
    }

    const enrollment = enrollmentDoc.data();

    // 检查状态
    if (enrollment?.status !== 'ready') {
      return NextResponse.json(
        { 
          success: false, 
          error: `无法开课：当前状态为 ${enrollment?.status}，需要先通过管理员审批` 
        },
        { status: 400 }
      );
    }

    // 检查是否已经在 Moodle 开课
    if (enrollment?.moodleInfo?.enrolled) {
      return NextResponse.json(
        { 
          success: false, 
          error: '该课程已在 Moodle 中开课' 
        },
        { status: 400 }
      );
    }

    if (!enrollment?.studentEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: '学生邮箱缺失，无法在 Moodle 开课' 
        },
        { status: 400 }
      );
    }

    // 发送到 Moodle 队列
    const taskPayload: MoodleTaskPayload = {
      enrollmentId,
      studentEmail: enrollment.studentEmail,
      courseName: enrollment.courseName,
    };

    // 异步创建任务（不等待）- 暂时禁用
    // createMoodleEnrollmentTask(taskPayload, {
    //   taskName: `moodle-${enrollmentId}`,  // 去重
    // })
    //   .catch(err => console.error('Failed to create Moodle task:', err));

    // 立即返回
    return NextResponse.json({
      success: true,
      message: 'Moodle 开课任务已创建，正在处理中...',
      data: {
        enrollmentId,
        status: 'processing',
      },
    });

  } catch (error: any) {
    console.error('Open course error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '开课失败' },
      { status: 500 }
    );
  }
}

