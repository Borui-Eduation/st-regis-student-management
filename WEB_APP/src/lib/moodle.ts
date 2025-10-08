/**
 * Moodle Web Service API 客户端
 * 
 * 使用说明：
 * 1. 在Moodle后台启用Web Services
 * 2. 创建外部服务（External Service）
 * 3. 生成用户Token
 * 4. 设置环境变量：MOODLE_URL 和 MOODLE_TOKEN
 */

interface MoodleConfig {
  url: string;
  token: string;
}

interface MoodleUser {
  id?: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
}

interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  categoryid?: number;
  startdate?: number;       // Unix timestamp
  enddate?: number;         // Unix timestamp
  summary?: string;         // 课程描述
}

interface MoodleEnrollment {
  roleid: number;      // 5=student, 3=editing teacher, 4=non-editing teacher
  userid: number;
  courseid: number;
}

class MoodleClient {
  private config: MoodleConfig;

  constructor() {
    const url = process.env.MOODLE_URL || process.env.NEXT_PUBLIC_MOODLE_URL;
    const token = process.env.MOODLE_TOKEN;

    if (!url || !token) {
      throw new Error('Moodle配置缺失：请设置 MOODLE_URL 和 MOODLE_TOKEN 环境变量');
    }

    this.config = {
      url: url.replace(/\/$/, ''), // 移除末尾斜杠
      token,
    };
  }

  /**
   * 调用 Moodle Web Service API
   */
  private async call(wsfunction: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${this.config.url}/webservice/rest/server.php`);
    
    // 设置查询参数
    url.searchParams.set('wstoken', this.config.token);
    url.searchParams.set('wsfunction', wsfunction);
    url.searchParams.set('moodlewsrestformat', 'json');

    // 添加函数参数
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // 处理数组和对象参数
        this.flattenParams(url.searchParams, key, value);
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 检查Moodle错误响应
      if (data.exception) {
        throw new Error(`Moodle错误: ${data.message || data.exception}`);
      }

      return data;
    } catch (error: any) {
      console.error('Moodle API调用失败:', {
        function: wsfunction,
        params,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 展平嵌套参数（Moodle需要特殊格式）
   */
  private flattenParams(
    searchParams: URLSearchParams,
    prefix: string,
    value: any
  ): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([key, val]) => {
            searchParams.set(`${prefix}[${index}][${key}]`, String(val));
          });
        } else {
          searchParams.set(`${prefix}[${index}]`, String(item));
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        searchParams.set(`${prefix}[${key}]`, String(val));
      });
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{
    success: boolean;
    siteName?: string;
    version?: string;
    error?: string;
  }> {
    try {
      const siteInfo = await this.call('core_webservice_get_site_info');
      return {
        success: true,
        siteName: siteInfo.sitename,
        version: siteInfo.release,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取用户信息（通过email）
   */
  async getUserByEmail(email: string): Promise<any> {
    const users = await this.call('core_user_get_users', {
      criteria: [
        {
          key: 'email',
          value: email,
        },
      ],
    });

    return users.users && users.users.length > 0 ? users.users[0] : null;
  }

  /**
   * 创建用户
   */
  async createUser(user: MoodleUser): Promise<any> {
    const users = await this.call('core_user_create_users', {
      users: [
        {
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          password: user.password || this.generatePassword(),
          auth: 'manual',
        },
      ],
    });

    return users[0];
  }

  /**
   * 获取或创建用户
   */
  async getOrCreateUser(user: MoodleUser): Promise<{ id: number; created: boolean }> {
    // 先尝试查找
    const existingUser = await this.getUserByEmail(user.email);
    
    if (existingUser) {
      return { id: existingUser.id, created: false };
    }

    // 不存在则创建
    const newUser = await this.createUser(user);
    return { id: newUser.id, created: true };
  }

  /**
   * 获取课程信息（通过shortname或ID）
   */
  async getCourse(identifier: string | number): Promise<MoodleCourse | null> {
    try {
      if (typeof identifier === 'number') {
        // 获取所有课程，然后找到匹配的
        const allCourses = await this.call('core_course_get_courses');
        const course = allCourses?.find((c: any) => c.id === identifier);
        
        if (course) {
          console.log(`✅ 找到Moodle课程 (ID: ${identifier}): ${course.fullname}`);
          return course;
        }
        
        console.warn(`⚠️  未找到Moodle课程 ID: ${identifier}`);
        return null;
      } else {
        // 通过shortname查找
        const courses = await this.call('core_course_search_courses', {
          criterianame: 'search',
          criteriavalue: identifier,
        });
        
        const course = courses.courses?.find(
          (c: any) => c.shortname === identifier
        );
        return course || null;
      }
    } catch (error) {
      console.error('获取课程失败:', error);
      return null;
    }
  }

  /**
   * 创建新课程
   * @param course 课程信息
   * @returns 创建的课程对象（包含 Moodle ID）
   */
  async createCourse(course: {
    fullname: string;
    shortname: string;
    categoryid?: number;
    summary?: string;
    format?: string;
    startdate?: number;
    enddate?: number;
  }): Promise<{ id: number; shortname: string } | null> {
    try {
      console.log('🆕 在 Moodle 中创建课程:', course.fullname);

      // 调用 Moodle API 创建课程
      const result = await this.call('core_course_create_courses', {
        courses: [
          {
            fullname: course.fullname,
            shortname: course.shortname,
            categoryid: course.categoryid || 1, // 默认分类 ID 为 1
            summary: course.summary || '',
            summaryformat: 1, // HTML 格式
            format: course.format || 'topics', // 默认主题格式
            startdate: course.startdate || Math.floor(Date.now() / 1000),
            enddate: course.enddate || 0, // 0 表示无结束日期
            visible: 1, // 可见
            showgrades: 1, // 显示成绩
            enablecompletion: 0, // 不启用完成跟踪
          },
        ],
      });

      if (result && result.length > 0) {
        console.log(`✅ Moodle 课程创建成功 (ID: ${result[0].id})`);
        return {
          id: result[0].id,
          shortname: result[0].shortname,
        };
      }

      return null;
    } catch (error: any) {
      console.error('❌ Moodle 课程创建失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有课程分类
   */
  async getCategories(): Promise<any[]> {
    try {
      const categories = await this.call('core_course_get_categories', {
        criteria: [],
      });
      return categories || [];
    } catch (error) {
      console.error('获取课程分类失败:', error);
      return [];
    }
  }

  /**
   * 将用户注册到课程
   */
  async enrollUser(enrollment: MoodleEnrollment): Promise<any> {
    return await this.call('enrol_manual_enrol_users', {
      enrolments: [
        {
          roleid: enrollment.roleid,
          userid: enrollment.userid,
          courseid: enrollment.courseid,
        },
      ],
    });
  }

  /**
   * 完整流程：将学生注册到课程
   */
  async enrollStudentToCourse(params: {
    studentEmail: string;
    studentFirstName: string;
    studentLastName: string;
    courseIdentifier: string | number; // course shortname 或 ID
  }): Promise<{
    success: boolean;
    moodleUserId?: number;
    moodleCourseId?: number;
    courseUrl?: string;
    userCreated?: boolean;
    error?: string;
  }> {
    try {
      // 1. 获取或创建用户
      const username = params.studentEmail.split('@')[0];
      const userResult = await this.getOrCreateUser({
        username,
        firstname: params.studentFirstName,
        lastname: params.studentLastName,
        email: params.studentEmail,
      });

      // 2. 获取课程
      const course = await this.getCourse(params.courseIdentifier);
      if (!course) {
        throw new Error(`课程未找到: ${params.courseIdentifier}`);
      }

      // 3. 注册用户到课程（roleid=5表示学生角色）
      await this.enrollUser({
        roleid: 5,
        userid: userResult.id,
        courseid: course.id,
      });

      // 4. 生成课程URL
      const courseUrl = `${this.config.url}/course/view.php?id=${course.id}`;

      return {
        success: true,
        moodleUserId: userResult.id,
        moodleCourseId: course.id,
        courseUrl,
        userCreated: userResult.created,
      };
    } catch (error: any) {
      console.error('Moodle注册失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 生成随机密码
   */
  private generatePassword(length: number = 12): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * 获取所有课程
   */
  async getAllCourses(): Promise<MoodleCourse[]> {
    try {
      const courses = await this.call('core_course_get_courses');
      return courses || [];
    } catch (error) {
      console.error('获取课程列表失败:', error);
      return [];
    }
  }

  /**
   * 获取所有用户
   * 注意：这个方法会获取所有课程中注册的用户（通过课程来获取）
   */
  async getAllUsers(): Promise<any[]> {
    try {
      console.log('🔍 开始获取所有用户（通过课程注册信息）...');
      
      // 1. 先获取所有课程
      const courses = await this.getAllCourses();
      console.log(`📚 找到 ${courses.length} 个课程`);
      
      if (courses.length === 0) {
        console.warn('⚠️ 没有找到任何课程');
        return [];
      }
      
      // 2. 获取每个课程的注册用户
      const userMap = new Map<number, any>();
      let processedCourses = 0;
      
      for (const course of courses) {
        try {
          // 跳过站点主页课程（通常是 ID 1）
          if (course.id === 1) {
            console.log(`  ⏭️  跳过站点主页课程`);
            continue;
          }
          
          console.log(`  📖 [${++processedCourses}/${courses.length - 1}] 获取课程 "${course.shortname}" (ID: ${course.id}) 的用户...`);
          
          // 使用官方的 Enrolment API
          const enrolledUsers = await this.call('core_enrol_get_enrolled_users', {
            courseid: course.id,
          });
          
          if (enrolledUsers && Array.isArray(enrolledUsers)) {
            console.log(`    ✓ 找到 ${enrolledUsers.length} 个注册用户`);
            enrolledUsers.forEach((user: any) => {
              // 去重：只保存第一次遇到的用户
              if (!userMap.has(user.id)) {
                userMap.set(user.id, user);
              }
            });
          } else {
            console.log(`    ⚠️ 课程无注册用户或返回格式错误`);
          }
        } catch (error: any) {
          console.warn(`  ✗ 获取课程 ${course.id} 的用户失败:`, error.message);
          // 继续处理其他课程
        }
      }
      
      const users = Array.from(userMap.values());
      console.log(`✅ 成功获取 ${users.length} 个唯一用户`);
      return users;
      
    } catch (error) {
      console.error('❌ 获取用户列表失败:', error);
      return [];
    }
  }

  /**
   * 获取用户的所有课程注册信息
   */
  async getUserCourses(userId: number): Promise<any[]> {
    try {
      const result = await this.call('core_enrol_get_users_courses', {
        userid: userId,
      });
      return result || [];
    } catch (error) {
      console.error('获取用户课程失败:', error);
      return [];
    }
  }

  /**
   * 获取所有课程及其注册的学生
   * 返回按课程分组的数据结构
   */
  async getAllCoursesWithStudents(): Promise<any[]> {
    try {
      console.log('📊 开始获取所有课程及其学生...');
      
      // 1. 获取所有课程
      const courses = await this.getAllCourses();
      console.log(`📚 找到 ${courses.length} 个课程`);
      
      if (courses.length === 0) {
        console.warn('⚠️ 没有找到任何课程');
        return [];
      }
      
      // 2. 获取每个课程的注册学生
      const coursesWithStudents = [];
      let processedCourses = 0;
      
      for (const course of courses) {
        try {
          // 跳过站点主页课程（通常是 ID 1）
          if (course.id === 1) {
            console.log(`  ⏭️  跳过站点主页课程`);
            continue;
          }
          
          console.log(`  📖 [${++processedCourses}/${courses.length - 1}] 获取课程 "${course.shortname}" (ID: ${course.id}) 的学生...`);
          
          // 使用官方的 Enrolment API
          const enrolledUsers = await this.call('core_enrol_get_enrolled_users', {
            courseid: course.id,
          });
          
          if (enrolledUsers && Array.isArray(enrolledUsers)) {
            // 过滤掉管理员和教师（只保留学生）
            const students = enrolledUsers.filter((user: any) => {
              // 检查用户角色，过滤掉管理员和教师
              const isAdmin = user.username?.toLowerCase().includes('admin');
              const isGuest = user.username === 'guest';
              const hasEmail = user.email && user.email.trim() !== '';
              
              return hasEmail && !isAdmin && !isGuest;
            });
            
            console.log(`    ✓ 找到 ${students.length} 个学生（总注册用户: ${enrolledUsers.length}）`);
            
            // 获取每个学生的详细注册信息（包括状态和截止日期）
            const studentsWithEnrolmentInfo = students.map((student: any) => {
              // Moodle 返回的用户对象可能包含 enrolledcourses 或 roles 信息
              // 我们需要提取注册状态和时间相关信息
              
              return {
                id: student.id,
                username: student.username,
                firstname: student.firstname,
                lastname: student.lastname,
                fullname: student.fullname || `${student.firstname} ${student.lastname}`,
                email: student.email,
                // 用户状态信息
                suspended: student.suspended || false,  // 用户是否被暂停
                // 注册相关信息（这些字段来自 enrolledUsers API）
                lastaccess: student.lastaccess,  // 最后访问时间
                firstaccess: student.firstaccess, // 首次访问时间
                // 从 groups 或 roles 中提取的信息
                groups: student.groups || [],
                roles: student.roles || [],
              };
            });
            
            coursesWithStudents.push({
              ...course,
              students: studentsWithEnrolmentInfo,
              studentCount: students.length,
              totalEnrollments: enrolledUsers.length,
            });
          } else {
            console.log(`    ⚠️ 课程无注册用户或返回格式错误`);
            coursesWithStudents.push({
              ...course,
              students: [],
              studentCount: 0,
              totalEnrollments: 0,
            });
          }
        } catch (error: any) {
          console.warn(`  ✗ 获取课程 ${course.id} 的学生失败:`, error.message);
          // 继续处理其他课程，但记录该课程
          coursesWithStudents.push({
            ...course,
            students: [],
            studentCount: 0,
            totalEnrollments: 0,
            error: error.message,
          });
        }
      }
      
      const totalStudents = coursesWithStudents.reduce((sum, c) => sum + c.studentCount, 0);
      console.log(`✅ 成功获取 ${coursesWithStudents.length} 个课程，共 ${totalStudents} 个学生注册`);
      return coursesWithStudents;
      
    } catch (error) {
      console.error('❌ 获取课程和学生信息失败:', error);
      return [];
    }
  }
  
  /**
   * 获取所有用户及其注册的课程（保留此方法以便向后兼容）
   * @deprecated 建议使用 getAllCoursesWithStudents()
   */
  async getAllUsersWithCourses(): Promise<any[]> {
    try {
      console.log('📊 开始获取所有用户及其课程...');
      
      // 1. 获取所有用户
      const users = await this.getAllUsers();
      console.log(`📝 原始用户数: ${users.length}`);
      
      if (users.length === 0) {
        console.warn('⚠️ 未找到任何用户');
        return [];
      }
      
      // 2. 过滤掉系统管理员账号（admin、guest等）
      const regularUsers = users.filter(user => 
        user.email && 
        !user.username.toLowerCase().includes('admin') && 
        user.username !== 'guest'
      );
      console.log(`👥 过滤后的用户数: ${regularUsers.length}`);

      // 3. 批量获取每个用户的课程（并行处理）
      console.log('📚 开始获取用户课程信息...');
      const usersWithCourses = await Promise.all(
        regularUsers.map(async (user) => {
          try {
            const courses = await this.getUserCourses(user.id);
            console.log(`  ✓ ${user.username}: ${courses.length} 个课程`);
            return {
              ...user,
              courses: courses,
              courseCount: courses.length,
            };
          } catch (error) {
            console.error(`  ✗ ${user.username}: 获取课程失败`, error);
            return {
              ...user,
              courses: [],
              courseCount: 0,
            };
          }
        })
      );

      console.log(`✅ 成功获取 ${usersWithCourses.length} 个用户的课程信息`);
      return usersWithCourses;
    } catch (error) {
      console.error('❌ 获取用户和课程信息失败:', error);
      return [];
    }
  }
}

// 导出单例
let moodleClient: MoodleClient | null = null;

export function getMoodleClient(): MoodleClient {
  if (!moodleClient) {
    moodleClient = new MoodleClient();
  }
  return moodleClient;
}

export { MoodleClient };



