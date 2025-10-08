/**
 * 数据迁移脚本：更新所有学生的 schoolType 字段
 * 根据 school 字段自动设置 schoolType
 * 
 * 运行方法：
 * npx ts-node scripts/migrate-school-type.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// 初始化 Firebase Admin
if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  throw new Error('Missing Firebase Admin credentials in environment variables');
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);
const studentsCollection = db.collection('students');

/**
 * 判断学校类型
 */
function determineSchoolType(schoolName: string | null | undefined): 'stregis' | 'outside' {
  if (!schoolName) {
    return 'outside';
  }
  
  const lowerSchoolName = schoolName.toLowerCase();
  return (lowerSchoolName.includes('st') && lowerSchoolName.includes('regis'))
    ? 'stregis'
    : 'outside';
}

/**
 * 迁移主函数
 */
async function migrateSchoolType() {
  console.log('🔄 开始迁移学生 schoolType 字段...\n');

  try {
    // 获取所有学生
    const snapshot = await studentsCollection.get();
    console.log(`📊 找到 ${snapshot.size} 个学生记录\n`);

    if (snapshot.empty) {
      console.log('✅ 没有学生记录需要迁移');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 批量更新（Firestore 限制每批最多 500 个操作）
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const studentId = doc.id;
      const school = data.school;
      const currentSchoolType = data.schoolType;

      // 计算应该的 schoolType
      const correctSchoolType = determineSchoolType(school);

      // 如果 schoolType 已经正确，跳过
      if (currentSchoolType === correctSchoolType) {
        console.log(`  ⏭️  跳过 ${data.name || studentId}: schoolType 已正确 (${currentSchoolType})`);
        skippedCount++;
        continue;
      }

      try {
        // 添加到批量更新
        batch.update(doc.ref, {
          schoolType: correctSchoolType,
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`  ✅ 更新 ${data.name || studentId}: ${school || 'N/A'} -> ${correctSchoolType}`);
        updatedCount++;
        operationCount++;

        // 如果达到批量大小限制，提交并创建新批次
        if (operationCount >= batchSize) {
          await batch.commit();
          console.log(`\n  📦 已提交批次 (${operationCount} 个操作)\n`);
          batch = db.batch();
          operationCount = 0;
        }
      } catch (error: any) {
        console.error(`  ❌ 更新失败 ${studentId}:`, error.message);
        errorCount++;
      }
    }

    // 提交剩余的批量操作
    if (operationCount > 0) {
      await batch.commit();
      console.log(`\n  📦 已提交最后批次 (${operationCount} 个操作)\n`);
    }

    // 输出统计
    console.log('\n' + '='.repeat(60));
    console.log('📊 迁移完成统计:');
    console.log('='.repeat(60));
    console.log(`✅ 成功更新: ${updatedCount} 个`);
    console.log(`⏭️  跳过（已正确）: ${skippedCount} 个`);
    console.log(`❌ 失败: ${errorCount} 个`);
    console.log(`📝 总计: ${snapshot.size} 个`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  部分记录更新失败，请检查日志');
      process.exit(1);
    } else {
      console.log('\n🎉 所有记录迁移成功！');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\n❌ 迁移过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行迁移
migrateSchoolType();

