import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { getMoodleClient } from '@/lib/moodle';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, Course } from '@/types';

/**
 * POST /api/admin/courses/sync-moodle
 * 从 Moodle 同步所有课程到 Firestore
 * 权限：管理员及以上
 * 
 * 功能：
 * 1. 获取 Moodle 所有课程
 * 2. 匹配或创建 Firestore courses 记录
 * 3. 更新课程信息（课程名称、shortname 等）
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 权限检查
    await requireRole(['admin', 'superadmin']);

    console.log('🔄 开始从 Moodle 同步课程...');

    // 2. 获取 Moodle 客户端
    const moodleClient = getMoodleClient();

    // 3. 测试 Moodle 连接
    const connectionTest = await moodleClient.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Moodle 连接失败: ${connectionTest.error}`);
    }

    console.log(`✅ Moodle 连接成功: ${connectionTest.siteName} (${connectionTest.version})`);

    // 4. 获取所有 Moodle 课程
    const moodleCourses = await moodleClient.getAllCourses();
    console.log(`📚 从 Moodle 获取到 ${moodleCourses.length} 门课程`);

    if (moodleCourses.length === 0) {
      return createSuccessResponse({
        synced: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        message: '没有找到 Moodle 课程'
      }, 'No courses found in Moodle');
    }

    // 5. 同步课程到 Firestore
    const stats = {
      synced: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    for (const moodleCourse of moodleCourses) {
      try {
        // 跳过站点主页
        if (moodleCourse.id === 1) {
          console.log(`  ⏭️  跳过站点主页课程`);
          stats.skipped++;
          continue;
        }

        // 跳过没有名称的课程
        if (!moodleCourse.fullname || !moodleCourse.shortname) {
          console.log(`  ⏭️  跳过无效课程 (ID: ${moodleCourse.id})`);
          stats.skipped++;
          continue;
        }

        console.log(`  📖 处理课程: ${moodleCourse.fullname} (${moodleCourse.shortname})`);

        // 提取年级信息（从课程名称中）
        const gradeMatch = moodleCourse.fullname.match(/\b(\d{1,2})\b/);
        const gradeLevel = gradeMatch ? parseInt(gradeMatch[1]) : null;

        // 提取科目信息
        const subject = extractSubject(moodleCourse.fullname);
        
        // 确定课程类别（文科/理科）
        const category = determineCategory(moodleCourse.fullname);

        // 查找现有课程（按 Moodle ID 或课程代码）
        const existingCourseQuery = await collections.courses
          .where('courseCode', '==', moodleCourse.shortname)
          .limit(1)
          .get();

        const courseData: any = {
          courseName: moodleCourse.fullname,
          courseCode: moodleCourse.shortname,
          subject: subject,
          category: category,
          gradeLevel: gradeLevel,
          academicYear: getCurrentAcademicYear(),
          semester: getCurrentSemester(),
          currentEnrollment: 0,
          basePrice: 0,  // 暂设为零，后续可手动调整
          description: moodleCourse.summary || '',
          
          // Moodle 相关信息
          moodleId: moodleCourse.id.toString(),
          
          status: 'active' as const,
          updatedAt: FieldValue.serverTimestamp(),
        };

        // 只在有值时添加可选字段
        if (moodleCourse.categoryid) {
          courseData.moodleCategoryId = moodleCourse.categoryid.toString();
        }

        if (existingCourseQuery.empty) {
          // 创建新课程
          const newCourseData: any = {
            ...courseData,
            courseId: '',
            currentEnrollment: 0,
            createdAt: FieldValue.serverTimestamp(),
          };

          const courseRef = await collections.courses.add(newCourseData);
          await courseRef.update({ courseId: courseRef.id });

          console.log(`    ✅ 创建新课程 (ID: ${courseRef.id})`);
          stats.created++;
        } else {
          // 更新现有课程
          const existingCourseId = existingCourseQuery.docs[0].id;
          await collections.courses.doc(existingCourseId).update(courseData);

          console.log(`    🔄 更新现有课程 (ID: ${existingCourseId})`);
          stats.updated++;
        }

        stats.synced++;

      } catch (error: any) {
        console.error(`    ❌ 同步课程失败: ${moodleCourse.fullname}`, error.message);
        stats.errors++;
      }
    }

    // 6. 返回同步统计
    console.log('\n' + '='.repeat(60));
    console.log('📊 Moodle 课程同步完成:');
    console.log('='.repeat(60));
    console.log(`✅ 成功同步: ${stats.synced} 门`);
    console.log(`➕ 新创建: ${stats.created} 门`);
    console.log(`🔄 已更新: ${stats.updated} 门`);
    console.log(`⏭️  跳过: ${stats.skipped} 门`);
    console.log(`❌ 错误: ${stats.errors} 门`);
    console.log('='.repeat(60));

    return createSuccessResponse({
      ...stats,
      moodleSite: connectionTest.siteName,
      moodleVersion: connectionTest.version,
      totalMoodleCourses: moodleCourses.length,
    }, `Successfully synced ${stats.synced} courses from Moodle`);

  } catch (error: any) {
    console.error('❌ Moodle 课程同步失败:', error);
    return createErrorResponse(error, 'Failed to sync courses from Moodle');
  }
}

/**
 * 从课程名称中提取科目
 */
function extractSubject(courseName: string): string {
  // 常见科目关键词
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

  // 默认为文科
  return 'arts';
}

/**
 * 获取当前学年
 */
function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 9月之后算新学年
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

/**
 * 根据类别获取基础价格
 * 注意：当前暂设为 0，需要后续手动设置价格
 */
function getBasePriceByCategory(category: 'arts' | 'science'): number {
  // 暂时返回 0，后续可以根据需要调整
  return 0;
}
