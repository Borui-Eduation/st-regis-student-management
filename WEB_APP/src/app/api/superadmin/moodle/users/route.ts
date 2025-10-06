/**
 * GET /api/superadmin/moodle/users
 * 获取 Moodle 中所有已注册用户及其课程
 * 权限：超级管理员
 * 🚀 已优化：使用缓存策略
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { getMoodleClient } from '@/lib/moodle';
import { tieredCachedFetch } from '@/lib/cache-tiered';
import { CACHE_STRATEGY } from '@/lib/cache';
import type { ApiResponse } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now();
  
  try {
    // 1. 权限检查
    await requireRole(['superadmin']);

    console.log('🔍 [API] 开始获取 Moodle 用户数据...');

    // 2. 临时禁用缓存以便调试（检查是否有 ?nocache=1 参数）
    const searchParams = req.nextUrl.searchParams;
    const noCache = searchParams.get('nocache') === '1';
    
    if (noCache) {
      console.log('⚠️ [API] 缓存已禁用（调试模式）');
    }

    const fetchData = async () => {
      console.log('📊 [API] 从 Moodle 获取课程和学生数据');
      
      // 3. 获取 Moodle 客户端
      const moodleClient = getMoodleClient();
      
      // 4. 获取所有课程及其学生
      const coursesWithStudents = await moodleClient.getAllCoursesWithStudents();
      console.log(`✅ [API] 获取到 ${coursesWithStudents.length} 个课程`);
      
      // 5. 格式化数据
      const formattedCourses = coursesWithStudents.map(course => ({
        id: course.id,
        fullname: course.fullname,
        shortname: course.shortname,
        visible: course.visible,
        categoryid: course.categoryid,
        students: course.students || [],
        studentCount: course.studentCount || 0,
        totalEnrollments: course.totalEnrollments || 0,
      }));

      // 计算总学生数（去重）
      const allStudentIds = new Set<number>();
      formattedCourses.forEach(course => {
        course.students.forEach((student: any) => {
          allStudentIds.add(student.id);
        });
      });

      return {
        courses: formattedCourses,
        totalCourses: formattedCourses.length,
        totalStudents: allStudentIds.size,
        totalEnrollments: formattedCourses.reduce((sum, c) => sum + c.studentCount, 0),
      };
    };

    // 使用或不使用缓存
    const data = noCache 
      ? await fetchData()
      : await tieredCachedFetch(
          'moodle:users:with-courses',
          fetchData,
          CACHE_STRATEGY.stats // 5分钟内存 + 15分钟Redis
        );

    const duration = Date.now() - startTime;
    console.log(`✅ [API] 完成，耗时: ${duration}ms`);

    // 6. 返回标准响应
    return createSuccessResponse(data, `Moodle users fetched successfully (${duration}ms)`);

  } catch (error: any) {
    console.error('获取 Moodle 用户失败:', error);
    
    // 如果是 Moodle 配置问题，返回友好提示
    if (error.message && error.message.includes('Moodle配置缺失')) {
      return createErrorResponse(
        new Error('Moodle 未配置或无法连接，请检查环境变量 MOODLE_URL 和 MOODLE_TOKEN'),
        'Moodle configuration error'
      );
    }
    
    return createErrorResponse(error, 'Failed to fetch Moodle users');
  }
}

