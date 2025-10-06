import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { getMoodleClient } from '@/lib/moodle';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, Course } from '@/types';

/**
 * POST /api/admin/courses/create
 * 创建新课程（同时创建到 Firestore 和 Moodle）
 * 权限：Superadmin 专用
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 权限检查 - 仅 Superadmin
    await requireRole(['superadmin']);

    // 2. 解析请求数据
    const body = await req.json();
    
    const {
      courseName,
      courseCode,
      subject,
      category,
      gradeLevel,
      description,
      basePrice,
      teacherId,
      academicYear,
      semester,
      maxEnrollment,
      minEnrollment,
      syncToMoodle = true,  // 是否同步到 Moodle
    } = body;

    // 3. 数据验证
    if (!courseName || !courseCode) {
      return createErrorResponse(
        new Error('课程名称和课程代码不能为空'),
        'Course name and course code are required'
      );
    }

    if (!['arts', 'science'].includes(category)) {
      return createErrorResponse(
        new Error('课程类别必须是 arts 或 science'),
        'Invalid course category'
      );
    }

    console.log(`📝 创建新课程: ${courseName} (${courseCode})`);

    // 4. 检查课程代码是否已存在
    const existingCourse = await collections.courses
      .where('courseCode', '==', courseCode)
      .limit(1)
      .get();

    if (!existingCourse.empty) {
      return createErrorResponse(
        new Error(`课程代码 "${courseCode}" 已存在`),
        'Course code already exists'
      );
    }

    let moodleId: string | undefined;
    let moodleCategoryId: string | undefined;

    // 5. 同步到 Moodle（如果启用）
    if (syncToMoodle) {
      try {
        const moodleClient = getMoodleClient();
        
        // 测试连接
        const connectionTest = await moodleClient.testConnection();
        if (!connectionTest.success) {
          console.warn('⚠️  Moodle 连接失败，跳过同步:', connectionTest.error);
        } else {
          console.log('🔄 同步课程到 Moodle...');
          
          const moodleCourse = await moodleClient.createCourse({
            fullname: courseName,
            shortname: courseCode,
            summary: description || '',
            categoryid: 1, // 默认分类，可以从配置中获取
          });

          if (moodleCourse) {
            moodleId = moodleCourse.id.toString();
            console.log(`✅ Moodle 课程创建成功 (ID: ${moodleId})`);
          }
        }
      } catch (moodleError: any) {
        console.error('❌ Moodle 同步失败:', moodleError.message);
        // 不阻止课程创建，只是记录错误
      }
    }

    // 6. 创建 Firestore 课程记录
    const courseData: any = {
      courseId: '', // 将在创建后更新
      courseName,
      courseCode,
      subject: subject || 'Other',
      category,
      gradeLevel: gradeLevel ? parseInt(gradeLevel) : null,
      
      teacherName: null, // 需要从 teachers 集合查询
      
      academicYear: academicYear || getCurrentAcademicYear(),
      semester: semester || getCurrentSemester(),
      
      currentEnrollment: 0,
      basePrice: basePrice ? parseFloat(basePrice) : 0,
      description: description || '',
      
      status: 'active' as const,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 只在有值时添加可选字段（避免undefined）
    if (teacherId && teacherId !== '' && teacherId !== null) {
      courseData.teacherId = teacherId;
    }
    
    if (maxEnrollment && maxEnrollment !== '' && maxEnrollment !== null) {
      courseData.maxEnrollment = parseInt(maxEnrollment);
    }
    
    if (minEnrollment && minEnrollment !== '' && minEnrollment !== null) {
      courseData.minEnrollment = parseInt(minEnrollment);
    }
    
    if (moodleId && moodleId !== '' && moodleId !== null) {
      courseData.moodleId = moodleId;
    }
    
    if (moodleCategoryId && moodleCategoryId !== '' && moodleCategoryId !== null) {
      courseData.moodleCategoryId = moodleCategoryId;
    }

    // 7. 保存到 Firestore
    const courseRef = await collections.courses.add(courseData);
    await courseRef.update({ courseId: courseRef.id });

    console.log(`✅ Firestore 课程创建成功 (ID: ${courseRef.id})`);

    // 8. 如果有教师ID，获取教师名称
    let teacherName: string | null = null;
    if (teacherId) {
      const teacherDoc = await collections.teachers.doc(teacherId).get();
      if (teacherDoc.exists) {
        teacherName = teacherDoc.data()?.name || null;
        await courseRef.update({ teacherName });
      }
    }

    // 9. 返回创建的课程
    const createdCourse: Course = {
      courseId: courseRef.id,
      ...courseData,
      teacherName,
      createdAt: courseData.createdAt as any,
      updatedAt: courseData.updatedAt as any,
    };

    return createSuccessResponse(
      {
        course: createdCourse,
        moodleSynced: !!moodleId,
        moodleId,
      },
      'Course created successfully'
    );

  } catch (error: any) {
    console.error('❌ 课程创建失败:', error);
    return createErrorResponse(error, 'Failed to create course');
  }
}

/**
 * 获取当前学年
 */
function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * 获取当前学期
 */
function getCurrentSemester(): string {
  const now = new Date();
  const month = now.getMonth() + 1;

  if (month >= 9 || month <= 1) {
    return 'Fall';
  } else if (month >= 2 && month <= 6) {
    return 'Spring';
  } else {
    return 'Summer';
  }
}

