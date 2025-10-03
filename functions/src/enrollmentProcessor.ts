/**
 * 注册处理函数 - 高并发核心
 * 
 * 设计目标：
 * - 支持 1000-2000 并发请求
 * - 自动扩展到 1000 个实例
 * - 幂等性（可重复执行）
 * - 快速失败和重试
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface EnrollmentTaskPayload {
  enrollmentIds: string[];
  priority?: 'high' | 'normal' | 'low';
}

export const processEnrollments = functions
  .runWith({
    timeoutSeconds: 540,        // 9 分钟超时
    memory: '2GB',              // 2GB 内存
    maxInstances: 1000,         // 🔥 最多 1000 个并发实例
    minInstances: 0,            // 按需启动（节省成本）
  })
  .https.onRequest(async (req, res) => {
    // 验证请求方法
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const startTime = Date.now();
    const payload = req.body as EnrollmentTaskPayload;

    try {
      // 验证负载
      if (!payload.enrollmentIds || payload.enrollmentIds.length === 0) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      console.log(`Processing ${payload.enrollmentIds.length} enrollments`);

      // 并行处理所有注册（使用 Promise.allSettled 避免单个失败影响整体）
      const results = await Promise.allSettled(
        payload.enrollmentIds.map(id => processIndividualEnrollment(id))
      );

      // 统计结果
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      const duration = Date.now() - startTime;

      console.log(`Processed ${successful} successful, ${failed} failed in ${duration}ms`);

      // 返回结果
      res.status(200).json({
        success: true,
        processed: payload.enrollmentIds.length,
        successful,
        failed,
        duration,
      });

    } catch (error: any) {
      console.error('Fatal error processing enrollments:', error);
      res.status(500).json({ error: error.message });
    }
  });

/**
 * 处理单个注册记录
 */
async function processIndividualEnrollment(enrollmentId: string): Promise<void> {
  const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
  
  // 使用事务确保数据一致性
  await db.runTransaction(async (transaction) => {
    const enrollmentDoc = await transaction.get(enrollmentRef);
    
    if (!enrollmentDoc.exists) {
      throw new Error(`Enrollment ${enrollmentId} not found`);
    }

    const enrollment = enrollmentDoc.data();
    
    // 幂等性检查：如果已经处理过，跳过
    if (enrollment?.processedAt) {
      console.log(`Enrollment ${enrollmentId} already processed`);
      return;
    }

    // 验证课程容量
    const courseRef = db.collection('courses').doc(enrollment!.courseId);
    const courseDoc = await transaction.get(courseRef);
    
    if (!courseDoc.exists) {
      throw new Error(`Course ${enrollment!.courseId} not found`);
    }

    const course = courseDoc.data();
    const maxEnrollment = course?.maxEnrollment || 999;
    const currentEnrollment = course?.currentEnrollment || 0;

    // 检查是否已满员
    if (currentEnrollment >= maxEnrollment) {
      transaction.update(enrollmentRef, {
        status: 'rejected',
        'approvalHistory': admin.firestore.FieldValue.arrayUnion({
          status: 'rejected',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          actor: 'system',
          comments: '课程已满员',
        }),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    // 更新课程注册人数
    transaction.update(courseRef, {
      currentEnrollment: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 标记为已处理
    transaction.update(enrollmentRef, {
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully processed enrollment ${enrollmentId}`);
  });
}

/**
 * 批量验证注册（可选的额外函数）
 */
export const validateEnrollments = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB',
    maxInstances: 100,
  })
  .https.onRequest(async (req, res) => {
    // 这个函数可以用于批量验证注册的合法性
    // 例如：检查学生资格、课程冲突等
    res.status(200).json({ message: 'Validation function placeholder' });
  });

