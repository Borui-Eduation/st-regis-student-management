import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { adminDb, collections, FieldValue } from '@/lib/firebase-admin';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getDefaultPasswordHash, hashPassword } from '@/lib/password';
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
    
    // 🚀 优化：一次性获取所有enrollments，避免N+1查询
    const studentIds = snapshot.docs.map(doc => doc.id);
    
    // 批量获取所有enrollments（使用 'in' 查询，最多10个ID一批）
    const enrollmentsMap = new Map<string, any[]>();
    
    if (studentIds.length > 0) {
      // Firestore 'in' 查询最多支持10个值，需要分批
      const batchSize = 10;
      const enrollmentPromises = [];
      
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);
        enrollmentPromises.push(
          collections.enrollments
            .where('studentId', 'in', batch)
            .get()
        );
      }
      
      const enrollmentSnapshots = await Promise.all(enrollmentPromises);
      
      // 构建enrollments映射表
      enrollmentSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(eDoc => {
          const eData = eDoc.data();
          const studentId = eData.studentId;
          
          if (!enrollmentsMap.has(studentId)) {
            enrollmentsMap.set(studentId, []);
          }
          
          enrollmentsMap.get(studentId)!.push({
            enrollmentId: eDoc.id,
            courseName: eData.courseName,
            teacherName: eData.teacherName,
            status: eData.status,
          });
        });
      });
    }
    
    // 组装学生数据（不需要异步）
    // 🔧 排除教师账号（避免老师出现在学生列表中）
    const teachersSnapshot = await collections.teachers.get();
    const teacherEmails = new Set(teachersSnapshot.docs.map(doc => doc.data().email?.toLowerCase()));
    
    let allStudents = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const email = data.email?.toLowerCase();
        const role = data.role;
        
        // 🚀 排除非学生账号：
        // 1. 排除教师邮箱
        // 2. 排除明确标记为管理员/中介的账号 (admin, superadmin, agent)
        // 3. 没有role字段的默认视为学生
        const isNonStudent = role && ['admin', 'superadmin', 'agent'].includes(role);
        
        return (
          email && 
          !teacherEmails.has(email) &&
          !isNonStudent
        );
      })
      .map(doc => {
      const data = doc.data();
      const studentId = doc.id;
      const enrollments = enrollmentsMap.get(studentId) || [];
      
      return {
        ...data,
        studentId,
        enrollmentDate: data.enrollmentDate?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        enrollments,
      };
    });

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
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '获取学生列表失败',
        message: 'Failed to fetch students'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/students
 * 创建新学生
 * 权限：管理员及以上
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await requireRole(['admin', 'superadmin']);

    const body = await req.json();
    const { name, email, phone, school, grade, parentName, parentEmail, parentPhone, status, role, customPassword } = body;

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required', message: '姓名为必填项' },
        { status: 400 }
      );
    }

    // 如果提供了邮箱，检查是否已存在
    if (email) {
      const existingStudent = await collections.students
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingStudent.empty) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email already in use',
            message: '该邮箱已被使用'
          },
          { status: 409 }
        );
      }
    }

    // 🎯 确定用户角色
    // SuperAdmin可以创建admin/superadmin账号，Admin只能创建学生
    const userRole = (session.user?.role === 'superadmin' && role) ? role : 'student';
    
    // 🔐 生成密码哈希
    // 只为 admin、agent、teacher 设置密码，学生不提供登录功能
    let hashedPassword = null;
    if (email && userRole !== 'student') {
      if (customPassword) {
        // 验证自定义密码
        if (customPassword.length < 8) {
          return NextResponse.json(
            { success: false, error: '密码至少需要8个字符', message: 'Password must be at least 8 characters' },
            { status: 400 }
          );
        }
        hashedPassword = await hashPassword(customPassword);
      } else {
        // 使用默认密码
        hashedPassword = await getDefaultPasswordHash();
      }
    }
    
    const studentData = {
      name,
      email: email || null,
      phone: phone || null,
      school: school || 'St. Regis',
      grade: grade ? parseInt(grade) : null,
      status: status || 'active',
      role: userRole, // 使用确定的角色
      currentCourses: 0,
      maxCoursesPerSemester: 4,
      totalPaid: 0,
      totalOwed: 0,
      parentName: parentName || null,
      parentEmail: parentEmail || null,
      parentPhone: parentPhone || null,
      hashedPassword: hashedPassword, // 只为非学生角色设置密码
      passwordSetAt: hashedPassword ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = collections.students.doc();
    await docRef.set(studentData);

    const newStudent = {
      studentId: docRef.id,
      ...studentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return createSuccessResponse(newStudent, 'Student created successfully', 201);
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to create student');
  }
}

