import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { getMoodleClient } from '@/lib/moodle';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, Course } from '@/types';

/**
 * GET /api/admin/courses/:id
 * 获取单个课程详情
 * 权限：管理员及以上
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const courseId = params.id;
    const courseDoc = await collections.courses.doc(courseId).get();

    if (!courseDoc.exists) {
      return createErrorResponse(
        new Error('课程不存在'),
        'Course not found'
      );
    }

    const course = {
      courseId: courseDoc.id,
      ...courseDoc.data(),
    } as Course;

    return createSuccessResponse(course, 'Course fetched successfully');

  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch course');
  }
}

/**
 * PUT /api/admin/courses/:id
 * 更新课程信息
 * 权限：Superadmin专用
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);

    const courseId = params.id;
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
      status,
      syncToMoodle = false, // 是否同步到Moodle
    } = body;

    console.log(`✏️  更新课程: ${courseId}`);

    // 检查课程是否存在
    const courseDoc = await collections.courses.doc(courseId).get();
    if (!courseDoc.exists) {
      return createErrorResponse(
        new Error('课程不存在'),
        'Course not found'
      );
    }

    const existingCourse = courseDoc.data() as Course;

    // 如果课程代码变化，检查新代码是否已存在
    if (courseCode && courseCode !== existingCourse.courseCode) {
      const duplicateCheck = await collections.courses
        .where('courseCode', '==', courseCode)
        .limit(1)
        .get();

      if (!duplicateCheck.empty && duplicateCheck.docs[0].id !== courseId) {
        return createErrorResponse(
          new Error(`课程代码 "${courseCode}" 已被其他课程使用`),
          'Course code already exists'
        );
      }
    }

    // 准备更新数据
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (courseName !== undefined) updateData.courseName = courseName;
    if (courseCode !== undefined) updateData.courseCode = courseCode;
    if (subject !== undefined) updateData.subject = subject;
    if (category !== undefined) updateData.category = category;
    if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel ? parseInt(gradeLevel) : null;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (semester !== undefined) updateData.semester = semester;
    // 只在有有效值时设置，避免undefined
    if (maxEnrollment !== undefined && maxEnrollment !== '' && maxEnrollment !== null) {
      updateData.maxEnrollment = parseInt(maxEnrollment);
    }
    if (minEnrollment !== undefined && minEnrollment !== '' && minEnrollment !== null) {
      updateData.minEnrollment = parseInt(minEnrollment);
    }
    if (status !== undefined) updateData.status = status;

    // 如果有教师ID，获取教师名称
    if (teacherId) {
      const teacherDoc = await collections.teachers.doc(teacherId).get();
      if (teacherDoc.exists) {
        updateData.teacherName = teacherDoc.data()?.name || null;
      }
    }

    // 同步到Moodle（如果有Moodle ID且启用同步）
    if (syncToMoodle && existingCourse.moodleId) {
      try {
        console.log(`🔄 同步课程到Moodle (ID: ${existingCourse.moodleId})...`);
        // Note: Moodle API不支持直接更新课程，只能通过Web界面或删除重建
        console.log('⚠️  Moodle API不支持更新课程，请手动在Moodle中更新');
      } catch (moodleError: any) {
        console.error('❌ Moodle同步失败:', moodleError.message);
        // 不阻止本地更新
      }
    }

    // 更新Firestore
    await collections.courses.doc(courseId).update(updateData);

    console.log(`✅ 课程更新成功: ${courseId}`);

    // 获取更新后的课程
    const updatedCourseDoc = await collections.courses.doc(courseId).get();
    const updatedCourse = {
      courseId: updatedCourseDoc.id,
      ...updatedCourseDoc.data(),
    } as Course;

    return createSuccessResponse(updatedCourse, 'Course updated successfully');

  } catch (error: any) {
    console.error('❌ 课程更新失败:', error);
    return createErrorResponse(error, 'Failed to update course');
  }
}

/**
 * DELETE /api/admin/courses/:id
 * 删除课程（软删除，设置为archived）
 * 权限：Superadmin专用
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);

    const courseId = params.id;

    console.log(`🗑️  删除课程: ${courseId}`);

    // 检查课程是否存在
    const courseDoc = await collections.courses.doc(courseId).get();
    if (!courseDoc.exists) {
      return createErrorResponse(
        new Error('课程不存在'),
        'Course not found'
      );
    }

    // 检查是否有学生注册了该课程
    const enrollmentsSnapshot = await collections.enrollments
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!enrollmentsSnapshot.empty) {
      // 有学生注册，只能归档，不能删除
      await collections.courses.doc(courseId).update({
        status: 'archived',
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`📦 课程已归档: ${courseId}`);
      return createSuccessResponse(null, 'Course archived (has enrollments)');
    }

    // 没有学生注册，可以直接删除
    await collections.courses.doc(courseId).delete();

    console.log(`✅ 课程已删除: ${courseId}`);
    return createSuccessResponse(null, 'Course deleted successfully');

  } catch (error: any) {
    console.error('❌ 课程删除失败:', error);
    return createErrorResponse(error, 'Failed to delete course');
  }
}
