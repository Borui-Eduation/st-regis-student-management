import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';

/**
 * GET /api/admin/students/[id]
 * 获取单个学生详细信息
 * 权限：管理员及以上
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'superadmin']);

    const { id } = await params;
    const studentDoc = await collections.students.doc(id).get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const studentData = {
      studentId: studentDoc.id,
      ...studentDoc.data(),
      createdAt: studentDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: studentDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
    };

    return createSuccessResponse(studentData);
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch student');
  }
}

/**
 * PATCH /api/admin/students/[id]
 * 更新学生信息
 * 权限：管理员及以上
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['admin', 'superadmin']);

    const { id } = await params;
    const body = await req.json();

    // 验证学生是否存在
    const studentDoc = await collections.students.doc(id).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // 允许更新的字段
    const allowedFields = [
      'name',
      'email',
      'phone',
      'school',
      'grade',
      'status',
      'parentName',
      'parentEmail',
      'parentPhone',
      'maxCoursesPerSemester'
    ];

    // 只有SuperAdmin可以修改角色
    if (body.role && session.user.role === 'superadmin') {
      allowedFields.push('role');
    }

    // 构建更新数据
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 🆕 如果更新了学校，自动更新学生来源
    if (body.school !== undefined) {
      const schoolName = body.school || 'St. Regis';
      updateData.schoolType = (schoolName.toLowerCase().includes('st') && schoolName.toLowerCase().includes('regis'))
        ? 'stregis'
        : 'outside';
    }

    // 如果更新邮箱，检查邮箱是否已被其他学生使用
    if (body.email && body.email !== studentDoc.data()?.email) {
      const existingStudent = await collections.students
        .where('email', '==', body.email)
        .limit(1)
        .get();

      if (!existingStudent.empty && existingStudent.docs[0].id !== id) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email already in use by another student',
            message: '该邮箱已被其他学生使用'
          },
          { status: 409 }
        );
      }
    }

    // 更新学生信息
    await collections.students.doc(id).update(updateData);

    // 获取更新后的数据
    const updatedDoc = await collections.students.doc(id).get();
    const updatedData = {
      studentId: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
    };

    return createSuccessResponse(updatedData, 'Student updated successfully');
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to update student');
  }
}

/**
 * DELETE /api/admin/students/[id]
 * 删除学生（软删除：设置status为inactive）
 * 权限：超级管理员
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin']);

    const { id } = await params;
    const studentDoc = await collections.students.doc(id).get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // 软删除：设置为inactive
    await collections.students.doc(id).update({
      status: 'inactive',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return createSuccessResponse(
      { studentId: id, status: 'inactive' },
      'Student deactivated successfully'
    );
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to delete student');
  }
}

