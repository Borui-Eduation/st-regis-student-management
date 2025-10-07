import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { getMoodleClient } from '@/lib/moodle';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/test-moodle
 * 测试Moodle连接
 * 权限：管理员及以上
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 权限检查
    await requireRole(['admin', 'superadmin']);
    
    console.log('🔍 开始测试Moodle连接...');
    
    // 2. 获取Moodle客户端
    const moodleClient = getMoodleClient();
    
    // 3. 测试连接
    const connectionResult = await moodleClient.testConnection();
    
    if (!connectionResult.success) {
      console.error('❌ Moodle连接失败:', connectionResult.error);
      return createErrorResponse(
        new Error(connectionResult.error || 'Moodle连接失败'),
        'Moodle connection test failed'
      );
    }
    
    console.log('✅ Moodle连接成功:', {
      siteName: connectionResult.siteName,
      version: connectionResult.version,
    });
    
    // 4. 获取课程列表（可选）
    let courses: any[] = [];
    try {
      courses = await moodleClient.getAllCourses();
      console.log(`📚 找到 ${courses.length} 个课程`);
    } catch (error: any) {
      console.warn('⚠️ 获取课程列表失败:', error.message);
    }
    
    // 5. 返回测试结果
    return createSuccessResponse(
      {
        connected: true,
        siteName: connectionResult.siteName,
        version: connectionResult.version,
        coursesCount: courses.length,
        courses: courses.slice(0, 5).map(c => ({
          id: c.id,
          fullname: c.fullname,
          shortname: c.shortname,
        })),
        config: {
          moodleUrl: process.env.MOODLE_URL || process.env.NEXT_PUBLIC_MOODLE_URL,
          tokenConfigured: !!process.env.MOODLE_TOKEN,
        },
      },
      'Moodle connection test successful'
    );
    
  } catch (error: any) {
    console.error('❌ Moodle测试失败:', error);
    return createErrorResponse(error, 'Failed to test Moodle connection');
  }
}

/**
 * POST /api/admin/test-moodle
 * 测试Moodle注册功能
 * 权限：管理员及以上
 * 
 * Body:
 * {
 *   "studentEmail": "test@example.com",
 *   "studentFirstName": "Test",
 *   "studentLastName": "Student",
 *   "courseIdentifier": "COURSE-001" // shortname 或 course ID
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 权限检查
    await requireRole(['admin', 'superadmin']);
    
    // 2. 解析请求体
    const body = await req.json();
    const {
      studentEmail,
      studentFirstName,
      studentLastName,
      courseIdentifier,
    } = body;
    
    if (!studentEmail || !studentFirstName || !studentLastName || !courseIdentifier) {
      return createErrorResponse(
        new Error('缺少必要参数'),
        'Missing required parameters'
      );
    }
    
    console.log('🔍 测试Moodle注册:', {
      email: studentEmail,
      course: courseIdentifier,
    });
    
    // 3. 获取Moodle客户端
    const moodleClient = getMoodleClient();
    
    // 4. 执行注册
    const result = await moodleClient.enrollStudentToCourse({
      studentEmail,
      studentFirstName,
      studentLastName,
      courseIdentifier,
    });
    
    if (!result.success) {
      console.error('❌ Moodle注册失败:', result.error);
      return createErrorResponse(
        new Error(result.error || 'Moodle注册失败'),
        'Moodle enrollment test failed'
      );
    }
    
    console.log('✅ Moodle注册成功:', result);
    
    return createSuccessResponse(result, 'Moodle enrollment test successful');
    
  } catch (error: any) {
    console.error('❌ Moodle注册测试失败:', error);
    return createErrorResponse(error, 'Failed to test Moodle enrollment');
  }
}







