/**
 * 导入更新的学生数据到 Firestore
 * 
 * 使用方法：
 * npx tsx scripts/import-student-updates.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 初始化 Firebase Admin
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: privateKey!,
    }),
  });
}

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'studentapp';
const db = getFirestore(databaseId);

// 学生数据（从表格复制）
const studentData = [
  { id: 1, agent: '', name: 'He, Yiran', school: 'St. Reigs', email: 'heyiran85@gmail.com', course: 'Pre Calculus 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 2, agent: '', name: 'Vynnyk, Anna', school: 'St. Reigs', email: 'annav9469@gmail.com', course: 'Econ Theory 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 3, agent: '', name: 'Kardash, Lesia', school: 'St. Reigs', email: 'lesiakardas5@gmail.com', course: 'Calculus 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 4, agent: '', name: 'Vasylkiv, Volodymyr', school: 'St. Reigs', email: 'vldmr1036@gmail.com', course: 'French 11', teacher: 'AJ', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 5, agent: '', name: 'Naida, Sofia', school: 'St. Reigs', email: '202009sofia@gmail.com', course: 'French 11', teacher: 'AJ', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 6, agent: '', name: 'Sakvuk, Sofiia-Mariia', school: 'St. Reigs', email: 'sakvuksophia7@gmail.com', course: 'French 11', teacher: 'AJ', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 7, agent: '', name: 'Adhanom Tewelde, Shalom', school: 'St. Reigs', email: 'shalomadhanom77@gmail.com', course: 'French 11', teacher: 'AJ', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 8, agent: '', name: 'Liu, Qinghua', school: 'St. Reigs', email: 'mikekuso360@gmail.com', course: 'Life Science 11', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 9, agent: '', name: 'Liu, Qinghua', school: 'St. Reigs', email: 'mikekuso360@gmail.com', course: 'Pre Calculus 11', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 10, agent: '', name: 'Liu, Qinghua', school: 'St. Reigs', email: 'mikekuso360@gmail.com', course: 'Mandarin 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 11, agent: '', name: 'Liu, Qinghua', school: 'St. Reigs', email: 'mikekuso360@gmail.com', course: 'Physics 11', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 12, agent: '', name: 'Jan Khan, Selai Isabella', school: 'St. Reigs', email: 'bellakhan2009@gmail.com', course: 'Life Science 11', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 13, agent: '', name: 'Nega, Eliana Daniel', school: 'St. Reigs', email: 'elianadaniel.n@gmail.com', course: 'Life Science 11', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 14, agent: 'Alex', name: 'Mu, Liuyu', school: 'Outside', email: 'liuyu.mu@surreyschools.ca', course: 'Calculus 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 15, agent: 'Alex', name: 'Wang, Yunjia', school: 'Outside', email: 'cafcwei@gmail.com', course: 'Physics 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 16, agent: '', name: 'Qu, Yuanbin', school: 'St. Reigs', email: 'leoqu0725@gmail.com', course: 'Mandarin 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 17, agent: 'Alex', name: 'Li, Qiaomeng', school: 'Outside', email: 'lxmlqm@gmail.com', course: 'English First Peoples 12', teacher: 'Ms. Holloway', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 18, agent: 'Alex', name: 'Li, Qiaomeng', school: 'Outside', email: 'lxmlqm@gmail.com', course: 'Calculus 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 19, agent: 'Alex', name: 'Li, Yu', school: 'Outside', email: 'summerfang8@gmail.com', course: 'EFP Literary Studies and Writing 11', teacher: 'Ms. Holloway', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 20, agent: 'Renee', name: 'Shan, Mingge', school: 'Outside', email: 'minggeshang21@gmail.com', course: 'Pre Calculus 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 21, agent: '', name: 'Seifu, Hemen Samuel', school: 'St. Reigs', email: 'amyseifu1@gmail.com', course: 'Life Science 11', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 22, agent: '', name: 'Cheng, Chung Him', school: 'St. Reigs', email: 'hk57229122@gmail.com', course: 'Anatomy and Physiology 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 23, agent: '', name: 'Cheng, Chung Him', school: 'St. Reigs', email: 'hk57229122@gmail.com', course: 'Chemistry 11', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 24, agent: '', name: 'Cheng, Chung Him', school: 'St. Reigs', email: 'hk57229122@gmail.com', course: 'Political Studies12', teacher: 'Ms. Holloway', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 25, agent: '', name: 'Wang, Pengshuo', school: 'St. Reigs', email: 'iamscott610@gmail.com', course: 'English 8', teacher: 'N/AOnly Final', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Oct 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 26, agent: '', name: 'Wang, Pengshuo', school: 'St. Reigs', email: 'iamscott610@gmail.com', course: 'Math 8', teacher: 'N/AOnly Final', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Oct 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 27, agent: 'Renee', name: 'Wang, Jia', school: 'Outside', email: 'jia927027@gmail.com', course: 'Mandarin 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 28, agent: '', name: 'Qu, Yuanbin', school: 'St. Reigs', email: 'leoqu0725@gmail.com', course: 'Econ Theory 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: 'Added' },
  { id: 29, agent: 'Alex', name: 'Han, Mingyu', school: 'Outside', email: 'h2746865392@gmail.com', course: 'Pre Calculus 12', teacher: 'Mr. Song', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 30, agent: 'Song', name: 'Chen, Zihan', school: 'Outside', email: 'zihanc403@deltalearns.ca', course: '20th Century World History 12', teacher: 'Ms. Holloway', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 31, agent: '', name: 'Mao, Zeyi', school: 'St. Reigs', email: 'iamscott610@gmail.com', course: 'Mathematics 8', teacher: 'Mr. Zhang, Kehan', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 32, agent: '', name: 'Mao, Zeyi', school: 'St. Reigs', email: 'iamscott610@gmail.com', course: 'Science 8', teacher: 'Mr. Zhang, Kehan', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  { id: 33, agent: '', name: 'Xi, Nan', school: 'St. Reigs', email: '15326410000@163.com', course: '20th Century World History 12', teacher: 'Ms. Holloway', status: 'Opened', midtermGrade: '', finalGrade: '', endTime: 'Jan 20th, 2026', midtermComments: '', finalComments: '', myEdBC: '' },
  
  // 以下是 Not Ready 状态的记录，将被跳过
  // { id: 34, agent: '', name: 'Darville, Serenity Jazzlyn Faith', school: 'St. Reigs', email: '', course: 'Social Studies 9', teacher: 'Not Ready', status: 'Not Ready' },
  // { id: 35, agent: '', name: 'Darville, Serenity Jazzlyn Faith', school: 'St. Reigs', email: '', course: 'Science 9', teacher: 'Not Ready', status: 'Not Ready' },
  // { id: 36, agent: '', name: 'Darville, Serenity Jazzlyn Faith', school: 'St. Reigs', email: '', course: 'TERM 2Literary Studies 10/ New Media 10', teacher: 'Not Ready', status: 'Not Ready' },
  // { id: 37, agent: '', name: 'Darville, Serenity Jazzlyn Faith', school: 'St. Reigs', email: '', course: 'TERM 2Science 10', teacher: 'Not Ready', status: 'Not Ready' },
];

interface StudentRecord {
  studentId: string;
  name: string;
  email: string;
  school: string;
  schoolType: 'stregis' | 'outside';
  agentId?: string;
  agentName?: string;
  status: 'active' | 'inactive';
  currentCourses: number;
  maxCoursesPerSemester: number;
  totalPaid: number;
  totalOwed: number;
  createdAt: any;
  updatedAt: any;
}

interface EnrollmentRecord {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  teacherName: string | null;
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  midtermMark?: string;
  midtermComments?: string;
  finalGrade?: string;
  finalComments?: string;
  status: string;
  myEdBCStatus?: string;
  approvalHistory: any[];
  payment: any;
  createdAt: any;
  updatedAt: any;
}

async function main() {
  console.log('🚀 开始导入学生数据...\n');

  const stats = {
    studentsProcessed: 0,
    studentsCreated: 0,
    studentsUpdated: 0,
    enrollmentsProcessed: 0,
    enrollmentsCreated: 0,
    enrollmentsUpdated: 0,
    errors: 0,
  };

  // 按学生分组数据
  const studentMap = new Map<string, any[]>();
  
  for (const row of studentData) {
    if (row.status !== 'Opened') {
      console.log(`⏭️  跳过 Not Ready 记录: ${row.name} - ${row.course}`);
      continue;
    }

    const key = row.email;
    if (!studentMap.has(key)) {
      studentMap.set(key, []);
    }
    studentMap.get(key)!.push(row);
  }

  console.log(`📊 找到 ${studentMap.size} 个唯一学生，共 ${studentData.filter(r => r.status === 'Opened').length} 条注册记录\n`);

  // 获取或创建中介映射
  const agentMap = new Map<string, string>();
  const agentsSnapshot = await db.collection('agents').get();
  agentsSnapshot.docs.forEach(doc => {
    agentMap.set(doc.data().name, doc.id);
  });

  // 处理每个学生
  for (const [email, courses] of studentMap.entries()) {
    const firstCourse = courses[0];
    const studentName = firstCourse.name;
    
    try {
      console.log(`\n👤 处理学生: ${studentName} (${email})`);
      
      // 1. 查找或创建学生记录
      const studentsRef = db.collection('students');
      const existingStudent = await studentsRef
        .where('email', '==', email)
        .limit(1)
        .get();

      let studentId: string;
      let agentId: string | undefined;

      // 处理中介信息
      if (firstCourse.agent) {
        if (!agentMap.has(firstCourse.agent)) {
          // 创建新中介
          console.log(`  📝 创建新中介: ${firstCourse.agent}`);
          const agentRef = await db.collection('agents').add({
            name: firstCourse.agent,
            email: `${firstCourse.agent.toLowerCase()}@agent.com`,
            status: 'active',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          agentId = agentRef.id;
          agentMap.set(firstCourse.agent, agentId);
        } else {
          agentId = agentMap.get(firstCourse.agent);
        }
      }

      if (existingStudent.empty) {
        // 创建新学生
        console.log(`  ➕ 创建新学生记录`);
        const studentData: StudentRecord = {
          studentId: '', // will be set after creation
          name: studentName,
          email: email,
          school: firstCourse.school,
          schoolType: firstCourse.school === 'St. Reigs' ? 'stregis' : 'outside',
          agentId: agentId,
          agentName: firstCourse.agent || undefined,
          status: 'active',
          currentCourses: courses.length,
          maxCoursesPerSemester: 4,
          totalPaid: 0,
          totalOwed: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        const studentRef = await studentsRef.add(studentData);
        studentId = studentRef.id;
        
        // 更新 studentId 字段
        await studentRef.update({ studentId: studentId });
        
        stats.studentsCreated++;
        console.log(`  ✅ 学生创建成功 (ID: ${studentId})`);
      } else {
        // 更新现有学生
        studentId = existingStudent.docs[0].id;
        console.log(`  🔄 更新现有学生 (ID: ${studentId})`);
        
        await studentsRef.doc(studentId).update({
          name: studentName,
          school: firstCourse.school,
          schoolType: firstCourse.school === 'St. Reigs' ? 'stregis' : 'outside',
          agentId: agentId || FieldValue.delete(),
          agentName: firstCourse.agent || FieldValue.delete(),
          currentCourses: courses.length,
          updatedAt: FieldValue.serverTimestamp(),
        });
        
        stats.studentsUpdated++;
      }

      stats.studentsProcessed++;

      // 2. 处理每个课程的注册记录
      for (const courseData of courses) {
        try {
          console.log(`  📚 处理课程: ${courseData.course}`);
          
          // 查找课程
          const coursesRef = db.collection('courses');
          const existingCourse = await coursesRef
            .where('courseName', '==', courseData.course)
            .limit(1)
            .get();

          let courseId: string;

          if (existingCourse.empty) {
            console.log(`    ⚠️  课程不存在，跳过: ${courseData.course}`);
            continue;
          } else {
            courseId = existingCourse.docs[0].id;
          }

          // 查找或创建注册记录
          const enrollmentsRef = db.collection('enrollments');
          const existingEnrollment = await enrollmentsRef
            .where('studentId', '==', studentId)
            .where('courseId', '==', courseId)
            .limit(1)
            .get();

          const enrollmentData: Partial<EnrollmentRecord> = {
            studentId: studentId,
            studentName: studentName,
            studentEmail: email,
            courseId: courseId,
            courseName: courseData.course,
            teacherName: courseData.teacher,
            academicYear: '2025-2026',
            semester: 'Spring 2026',
            startDate: '2025-09-01',
            endDate: courseData.endTime,
            midtermMark: courseData.midtermGrade || '',
            midtermComments: courseData.midtermComments || '',
            finalGrade: courseData.finalGrade || '',
            finalComments: courseData.finalComments || '',
            status: 'open',
            myEdBCStatus: courseData.myEdBC || undefined,
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (existingEnrollment.empty) {
            // 创建新注册记录
            console.log(`    ➕ 创建新注册记录`);
            
            const newEnrollment = {
              ...enrollmentData,
              enrollmentId: '',
              approvalHistory: [{
                status: 'open',
                timestamp: FieldValue.serverTimestamp(),
                actor: 'system',
                comments: 'Imported from updated student data'
              }],
              payment: {
                paid: true,
                paidAt: FieldValue.serverTimestamp(),
                amount: 0,
                basePrice: 0,
                finalPrice: 0,
                method: 'manual',
                currency: 'CAD',
              },
              createdAt: FieldValue.serverTimestamp(),
            };

            const enrollmentRef = await enrollmentsRef.add(newEnrollment);
            await enrollmentRef.update({ enrollmentId: enrollmentRef.id });
            
            stats.enrollmentsCreated++;
            console.log(`    ✅ 注册记录创建成功`);
          } else {
            // 更新现有注册记录
            const enrollmentId = existingEnrollment.docs[0].id;
            console.log(`    🔄 更新现有注册记录`);
            
            await enrollmentsRef.doc(enrollmentId).update(enrollmentData);
            
            stats.enrollmentsUpdated++;
            console.log(`    ✅ 注册记录更新成功`);
          }

          stats.enrollmentsProcessed++;

        } catch (error: any) {
          console.error(`    ❌ 处理课程失败: ${courseData.course}`, error.message);
          stats.errors++;
        }
      }

    } catch (error: any) {
      console.error(`❌ 处理学生失败: ${studentName}`, error.message);
      stats.errors++;
    }
  }

  // 打印统计信息
  console.log('\n' + '='.repeat(60));
  console.log('📊 导入完成统计:');
  console.log('='.repeat(60));
  console.log(`👥 学生处理: ${stats.studentsProcessed} 个`);
  console.log(`  ➕ 新创建: ${stats.studentsCreated} 个`);
  console.log(`  🔄 已更新: ${stats.studentsUpdated} 个`);
  console.log(`\n📚 注册记录处理: ${stats.enrollmentsProcessed} 条`);
  console.log(`  ➕ 新创建: ${stats.enrollmentsCreated} 条`);
  console.log(`  🔄 已更新: ${stats.enrollmentsUpdated} 条`);
  console.log(`\n❌ 错误: ${stats.errors} 个`);
  console.log('='.repeat(60));
  console.log('\n✅ 导入完成！');
}

// 运行脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });


