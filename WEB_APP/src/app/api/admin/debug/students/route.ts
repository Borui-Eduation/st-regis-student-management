/**
 * GET /api/admin/debug/students
 * 调试API：显示所有学生及其角色
 * 权限：超级管理员
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { isSystemUserEmail } from '@/lib/permissions';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    // 获取所有学生记录
    const studentsSnapshot = await collections.students.get();
    
    // 获取教师邮箱
    const teachersSnapshot = await collections.teachers.get();
    const teacherEmails = new Set(teachersSnapshot.docs.map(doc => doc.data().email?.toLowerCase()));
    
    const allStudents = studentsSnapshot.docs.map(doc => {
      const data = doc.data();
      const email = data.email?.toLowerCase();
      const role = data.role;
      
      const isTeacher = email && teacherEmails.has(email);
      const isSystemUser = email && isSystemUserEmail(email);
      const willBeFiltered = !email || isTeacher || isSystemUser;
      
      return {
        studentId: doc.id,
        name: data.name,
        email: data.email,
        role: role || '(未设置)',
        isTeacher,
        isSystemUser,
        willBeFiltered,
        reason: willBeFiltered 
          ? (!email ? '无邮箱' : isTeacher ? '教师账号' : '系统用户')
          : '✅ 会显示',
      };
    });
    
    const filteredCount = allStudents.filter(s => s.willBeFiltered).length;
    const visibleCount = allStudents.filter(s => !s.willBeFiltered).length;
    
    return createSuccessResponse({
      total: allStudents.length,
      visible: visibleCount,
      filtered: filteredCount,
      students: allStudents,
    }, 'Debug info fetched');
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch debug info');
  }
}

