import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { getMoodleClient } from '@/lib/moodle';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

/**
 * POST /api/admin/courses/:id/sync-from-moodle
 * 用Moodle的课程数据覆盖本地课程
 * 权限：Superadmin专用
 * 
 * Request Body:
 * {
 *   moodleCourseId: number  // Moodle课程ID
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);

    const courseId = params.id;
    const body = await req.json();
    const { moodleCourseId } = body;

    if (!moodleCourseId) {
      return createErrorResponse(
        new Error('缺少Moodle课程ID'),
        'Moodle course ID is required'
      );
    }

    console.log(`🔄 用Moodle课程 (ID: ${moodleCourseId}) 覆盖本地课程 (ID: ${courseId})...`);

    // 1. 检查本地课程是否存在
    const courseDoc = await collections.courses.doc(courseId).get();
    if (!courseDoc.exists) {
      return createErrorResponse(
        new Error('本地课程不存在'),
        'Local course not found'
      );
    }

    // 2. 获取Moodle课程信息
    const moodleClient = getMoodleClient();
    const moodleCourse = await moodleClient.getCourse(moodleCourseId);

    if (!moodleCourse) {
      return createErrorResponse(
        new Error('Moodle课程不存在'),
        'Moodle course not found'
      );
    }

    console.log(`📚 找到Moodle课程: ${moodleCourse.fullname} (${moodleCourse.shortname})`);

    // 3. 提取课程信息
    const gradeMatch = moodleCourse.fullname.match(/\b(\d{1,2})\b/);
    const gradeLevel = gradeMatch ? parseInt(gradeMatch[1]) : null;
    const subject = extractSubject(moodleCourse.fullname);
    const category = determineCategory(moodleCourse.fullname);

    // 4. 准备更新数据（保留本地的价格、老师等信息）
    const existingCourse = courseDoc.data();
    const updateData: any = {
      // 从Moodle覆盖的字段
      courseName: moodleCourse.fullname,
      courseCode: moodleCourse.shortname,
      subject: subject,
      category: category,
      gradeLevel: gradeLevel,
      description: moodleCourse.summary || '',
      
      // Moodle关联信息
      moodleId: moodleCourse.id.toString(),
      
      // 保留本地信息
      basePrice: existingCourse?.basePrice || 0,
      academicYear: existingCourse?.academicYear || getCurrentAcademicYear(),
      semester: existingCourse?.semester || getCurrentSemester(),
      status: existingCourse?.status || 'active',
      
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 只在有值时添加可选字段（避免undefined）
    if (moodleCourse.categoryid) {
      updateData.moodleCategoryId = moodleCourse.categoryid.toString();
    }
    
    if (existingCourse?.teacherId) {
      updateData.teacherId = existingCourse.teacherId;
    }
    
    if (existingCourse?.teacherName) {
      updateData.teacherName = existingCourse.teacherName;
    }
    
    if (existingCourse?.maxEnrollment !== undefined) {
      updateData.maxEnrollment = existingCourse.maxEnrollment;
    }
    
    if (existingCourse?.minEnrollment !== undefined) {
      updateData.minEnrollment = existingCourse.minEnrollment;
    }

    // 5. 更新Firestore
    await collections.courses.doc(courseId).update(updateData);

    console.log(`✅ 课程已用Moodle数据覆盖: ${courseId}`);

    // 6. 获取更新后的课程
    const updatedCourseDoc = await collections.courses.doc(courseId).get();
    const updatedCourse = {
      courseId: updatedCourseDoc.id,
      ...updatedCourseDoc.data(),
    };

    return createSuccessResponse({
      course: updatedCourse,
      moodleCourse: {
        id: moodleCourse.id,
        fullname: moodleCourse.fullname,
        shortname: moodleCourse.shortname,
      },
    }, 'Course synced from Moodle successfully');

  } catch (error: any) {
    console.error('❌ 从Moodle同步课程失败:', error);
    return createErrorResponse(error, 'Failed to sync course from Moodle');
  }
}

/**
 * 从课程名称中提取科目
 */
function extractSubject(courseName: string): string {
  const subjects: { [key: string]: RegExp } = {
    'Mathematics': /math|calculus|algebra|geometry|pre-calc|precalculus/i,
    'Science': /science|physics|chemistry|biology|anatomy/i,
    'English': /english|literature|writing|literacy|EFP/i,
    'History': /history|social studies|politics/i,
    'French': /french|français/i,
    'Mandarin': /mandarin|chinese|中文/i,
    'Economics': /econ|economics/i,
    'Computer Science': /computer|programming|coding/i,
  };

  for (const [subject, pattern] of Object.entries(subjects)) {
    if (pattern.test(courseName)) {
      return subject;
    }
  }

  return 'Other';
}

/**
 * 确定课程类别（文科/理科）
 */
function determineCategory(courseName: string): 'arts' | 'science' {
  const scienceKeywords = /math|science|physics|chemistry|biology|calculus|algebra|geometry|anatomy/i;
  const artsKeywords = /english|literature|history|social|french|mandarin|writing|arts|economics|politics/i;

  if (scienceKeywords.test(courseName)) {
    return 'science';
  }

  if (artsKeywords.test(courseName)) {
    return 'arts';
  }

  return 'arts';
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
