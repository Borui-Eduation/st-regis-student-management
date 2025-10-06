/**
 * 批量更新课程价格
 * 
 * 使用方法：
 * npx tsx scripts/update-course-prices.ts
 * 
 * 功能：
 * - 理科课程：$1,800
 * - 文科课程：$1,600
 * - 或自定义价格
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

// 价格配置
const PRICES = {
  science: 1800,  // 理科课程价格（CAD）
  arts: 1600,     // 文科课程价格（CAD）
  default: 0,     // 默认价格（如果无法识别类别）
};

async function main() {
  console.log('🚀 开始批量更新课程价格...\n');

  const stats = {
    total: 0,
    scienceUpdated: 0,
    artsUpdated: 0,
    defaultUpdated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // 获取所有课程
    const coursesSnapshot = await db.collection('courses').get();
    stats.total = coursesSnapshot.size;

    console.log(`📚 找到 ${stats.total} 门课程\n`);

    if (stats.total === 0) {
      console.log('⚠️  没有找到课程，请先同步 Moodle 课程');
      return;
    }

    // 显示价格配置
    console.log('💰 价格配置:');
    console.log(`  理科课程 (Science): $${PRICES.science}`);
    console.log(`  文科课程 (Arts): $${PRICES.arts}`);
    console.log(`  其他课程: $${PRICES.default}\n`);

    // 确认操作
    console.log('⚠️  这将更新所有课程的价格！');
    console.log('   按 Ctrl+C 取消，或等待 3 秒自动继续...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔄 开始更新...\n');

    // 更新每门课程
    for (const doc of coursesSnapshot.docs) {
      const course = doc.data();
      const courseId = doc.id;
      const courseName = course.courseName || 'Unknown';
      const currentPrice = course.basePrice || 0;
      const category = course.category;

      try {
        let newPrice: number;

        // 根据类别确定价格
        if (category === 'science') {
          newPrice = PRICES.science;
          stats.scienceUpdated++;
        } else if (category === 'arts') {
          newPrice = PRICES.arts;
          stats.artsUpdated++;
        } else {
          newPrice = PRICES.default;
          stats.defaultUpdated++;
        }

        // 如果价格已经正确，跳过
        if (currentPrice === newPrice) {
          console.log(`  ⏭️  跳过: ${courseName} (价格已是 $${newPrice})`);
          stats.skipped++;
          continue;
        }

        // 更新价格
        await doc.ref.update({
          basePrice: newPrice,
          updatedAt: FieldValue.serverTimestamp(),
        });

        const categoryLabel = category === 'science' ? '理科' : category === 'arts' ? '文科' : '其他';
        console.log(`  ✅ ${courseName}`);
        console.log(`     类别: ${categoryLabel} | $${currentPrice} → $${newPrice}`);

      } catch (error: any) {
        console.error(`  ❌ 更新失败: ${courseName}`, error.message);
        stats.errors++;
      }
    }

    // 打印统计信息
    console.log('\n' + '='.repeat(60));
    console.log('📊 更新完成统计:');
    console.log('='.repeat(60));
    console.log(`📚 总课程数: ${stats.total} 门`);
    console.log(`✅ 成功更新: ${stats.scienceUpdated + stats.artsUpdated + stats.defaultUpdated} 门`);
    console.log(`  🔵 理科课程 ($${PRICES.science}): ${stats.scienceUpdated} 门`);
    console.log(`  🟣 文科课程 ($${PRICES.arts}): ${stats.artsUpdated} 门`);
    console.log(`  ⚪ 其他课程 ($${PRICES.default}): ${stats.defaultUpdated} 门`);
    console.log(`⏭️  已跳过: ${stats.skipped} 门`);
    console.log(`❌ 错误: ${stats.errors} 门`);
    console.log('='.repeat(60));
    console.log('\n✅ 价格更新完成！');

  } catch (error: any) {
    console.error('❌ 脚本执行失败:', error.message);
    throw error;
  }
}

// 运行脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });



