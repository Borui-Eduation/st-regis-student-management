import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { getMoodleClient } from '@/lib/moodle';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/courses/moodle-list
 * 获取Moodle中的所有课程列表
 * 权限：管理员及以上
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 权限检查
    await requireRole(['admin', 'superadmin']);

    console.log('🔍 获取Moodle课程列表...');

    // 2. 获取Moodle客户端
    const moodleClient = getMoodleClient();

    // 3. 测试连接
    const connectionTest = await moodleClient.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Moodle连接失败: ${connectionTest.error}`);
    }

    console.log(`✅ Moodle连接成功: ${connectionTest.siteName} (${connectionTest.version})`);

    // 4. 获取所有课程
    const moodleCourses = await moodleClient.getAllCourses();
    console.log(`📚 获取到 ${moodleCourses.length} 门Moodle课程`);

    // 5. 过滤掉站点主页
    const filteredCourses = moodleCourses.filter(course => 
      course.id !== 1 && course.fullname && course.shortname
    );

    console.log(`✅ 返回 ${filteredCourses.length} 门有效课程`);

    return createSuccessResponse({
      courses: filteredCourses,
      total: filteredCourses.length,
      moodleSite: connectionTest.siteName,
      moodleVersion: connectionTest.version,
    }, 'Successfully fetched Moodle courses');

  } catch (error: any) {
    console.error('❌ 获取Moodle课程失败:', error);
    return createErrorResponse(error, 'Failed to fetch Moodle courses');
  }
}



