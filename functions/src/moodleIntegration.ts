/**
 * Moodle API 集成
 * 
 * 通过 Moodle Web Services API 自动开课
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

interface MoodleTaskPayload {
  enrollmentId: string;
  studentEmail: string;
  courseName: string;
}

interface MoodleConfig {
  url: string;
  token: string;
  service: string;
}

export const enrollInMoodle = functions
  .runWith({
    timeoutSeconds: 300,  // 5 分钟（Moodle API 可能较慢）
    memory: '512MB',
    maxInstances: 100,
  })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const payload = req.body as MoodleTaskPayload;

    try {
      const { enrollmentId, studentEmail, courseName } = payload;

      if (!enrollmentId || !studentEmail || !courseName) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      console.log(`Starting Moodle enrollment for ${enrollmentId}`);

      // 获取 enrollment 记录
      const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
      const enrollmentDoc = await enrollmentRef.get();

      if (!enrollmentDoc.exists) {
        res.status(404).json({ error: 'Enrollment not found' });
        return;
      }

      const enrollment = enrollmentDoc.data();

      // 检查是否已经在 Moodle 中开课
      if (enrollment?.moodleInfo?.enrolled) {
        console.log('Already enrolled in Moodle, skipping...');
        res.status(200).json({ 
          success: true, 
          message: 'Already enrolled',
          moodleInfo: enrollment.moodleInfo,
        });
        return;
      }

      // Moodle 配置
      const moodleConfig: MoodleConfig = {
        url: process.env.MOODLE_URL || '',
        token: process.env.MOODLE_TOKEN || '',
        service: process.env.MOODLE_SERVICE || 'moodle_mobile_app',
      };

      if (!moodleConfig.url || !moodleConfig.token) {
        throw new Error('Moodle configuration missing');
      }

      // 1. 获取或创建 Moodle 用户
      const moodleUser = await getOrCreateMoodleUser(moodleConfig, {
        email: studentEmail,
        username: studentEmail.split('@')[0],
        firstname: enrollment?.studentName?.split(' ')[0] || 'Student',
        lastname: enrollment?.studentName?.split(' ').slice(1).join(' ') || 'Name',
      });

      console.log(`Moodle user: ${moodleUser.id}`);

      // 2. 查找对应的 Moodle 课程
      const moodleCourse = await findMoodleCourse(moodleConfig, courseName);

      if (!moodleCourse) {
        throw new Error(`Moodle course not found: ${courseName}`);
      }

      console.log(`Moodle course: ${moodleCourse.id}`);

      // 3. 注册用户到课程
      await enrollUserInCourse(moodleConfig, moodleUser.id, moodleCourse.id);

      console.log(`Enrolled user ${moodleUser.id} in course ${moodleCourse.id}`);

      // 4. 更新 Firestore
      const moodleInfo = {
        enrolled: true,
        moodleUserId: moodleUser.id.toString(),
        moodleCourseId: moodleCourse.id.toString(),
        courseUrl: `${moodleConfig.url}/course/view.php?id=${moodleCourse.id}`,
        enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await enrollmentRef.update({
        status: 'open',
        moodleInfo,
        'approvalHistory': admin.firestore.FieldValue.arrayUnion({
          status: 'open',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          actor: 'system',
          comments: 'Moodle 开课成功',
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Updated enrollment ${enrollmentId} to 'open' status`);

      res.status(200).json({
        success: true,
        moodleInfo,
      });

    } catch (error: any) {
      console.error('Moodle enrollment error:', error);

      // 记录错误到 Firestore
      if (payload.enrollmentId) {
        try {
          await db.collection('enrollments').doc(payload.enrollmentId).update({
            'moodleInfo.error': error.message,
            'moodleInfo.lastAttempt': admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (updateError) {
          console.error('Failed to update error in Firestore:', updateError);
        }
      }

      res.status(500).json({ error: error.message });
    }
  });

/**
 * 获取或创建 Moodle 用户
 */
async function getOrCreateMoodleUser(
  config: MoodleConfig,
  userData: { email: string; username: string; firstname: string; lastname: string }
) {
  // 1. 先尝试获取现有用户
  try {
    const users = await callMoodleAPI(config, 'core_user_get_users_by_field', {
      field: 'email',
      values: [userData.email],
    });

    if (users && users.length > 0) {
      return users[0];
    }
  } catch (error) {
    console.log('User not found, creating new user...');
  }

  // 2. 创建新用户
  const newUsers = await callMoodleAPI(config, 'core_user_create_users', {
    users: [{
      username: userData.username,
      password: generateRandomPassword(),
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      auth: 'manual',
    }],
  });

  if (!newUsers || newUsers.length === 0) {
    throw new Error('Failed to create Moodle user');
  }

  return { id: newUsers[0].id };
}

/**
 * 查找 Moodle 课程
 */
async function findMoodleCourse(config: MoodleConfig, courseName: string) {
  const courses = await callMoodleAPI(config, 'core_course_get_courses', {});

  if (!courses) {
    throw new Error('Failed to retrieve Moodle courses');
  }

  // 模糊匹配课程名称
  const course = courses.find((c: any) => 
    c.fullname.toLowerCase().includes(courseName.toLowerCase()) ||
    c.shortname.toLowerCase().includes(courseName.toLowerCase())
  );

  return course;
}

/**
 * 注册用户到课程
 */
async function enrollUserInCourse(config: MoodleConfig, userId: number, courseId: number) {
  // roleId = 5 通常是 Student 角色
  const result = await callMoodleAPI(config, 'enrol_manual_enrol_users', {
    enrolments: [{
      roleid: 5,
      userid: userId,
      courseid: courseId,
    }],
  });

  return result;
}

/**
 * 调用 Moodle API
 */
async function callMoodleAPI(config: MoodleConfig, functionName: string, params: any) {
  const url = `${config.url}/webservice/rest/server.php`;

  const formData = new URLSearchParams({
    wstoken: config.token,
    wsfunction: functionName,
    moodlewsrestformat: 'json',
  });

  // 添加参数
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object') {
          Object.keys(item).forEach(subKey => {
            formData.append(`${key}[${index}][${subKey}]`, item[subKey]);
          });
        } else {
          formData.append(`${key}[${index}]`, item);
        }
      });
    } else {
      formData.append(key, value);
    }
  });

  try {
    const response = await axios.post(url, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 60000,  // 60 秒超时
    });

    // 检查 Moodle 错误
    if (response.data.exception) {
      throw new Error(`Moodle API Error: ${response.data.message}`);
    }

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Moodle API response error:', error.response.data);
      throw new Error(`Moodle API failed: ${error.response.data.message || error.message}`);
    }
    throw error;
  }
}

/**
 * 生成随机密码
 */
function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * 测试 Moodle 连接
 */
export const testMoodleConnection = functions
  .https.onRequest(async (req, res) => {
    try {
      const config: MoodleConfig = {
        url: process.env.MOODLE_URL || '',
        token: process.env.MOODLE_TOKEN || '',
        service: process.env.MOODLE_SERVICE || 'moodle_mobile_app',
      };

      const siteInfo = await callMoodleAPI(config, 'core_webservice_get_site_info', {});

      res.status(200).json({
        success: true,
        siteInfo,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

