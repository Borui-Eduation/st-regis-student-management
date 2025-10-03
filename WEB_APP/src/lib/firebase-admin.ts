import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * 初始化 Firebase Admin SDK（服务端）
 */
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

/**
 * 获取 Firestore 实例（指定数据库 ID）
 */
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'studentapp';
export const adminDb = getFirestore(databaseId);

/**
 * Collection 引用
 */
export const collections = {
  students: adminDb.collection('students'),
  courses: adminDb.collection('courses'),
  enrollments: adminDb.collection('enrollments'),
  carts: adminDb.collection('carts'),
  emails: adminDb.collection('emails'),
} as const;

/**
 * Helper 函数：获取服务器时间戳
 */
export { FieldValue } from 'firebase-admin/firestore';

