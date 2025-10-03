/**
 * St Regis Enrollment System - Cloud Functions
 * 
 * 这些函数通过 Cloud Tasks 调用，支持高并发（1000-2000）
 */

import * as admin from 'firebase-admin';

// 初始化 Firebase Admin
admin.initializeApp();

// 设置 Firestore 数据库
const db = admin.firestore();
db.settings({ databaseId: process.env.FIREBASE_DATABASE_ID || 'studentapp' });

// 导出所有函数
export { processEnrollments } from './enrollmentProcessor';
export { sendEmail } from './emailSender';
export { enrollInMoodle } from './moodleIntegration';
export { onEnrollmentStatusChange } from './statusTriggers';

