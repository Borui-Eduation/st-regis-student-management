import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/health
 * 系统健康检查
 */
export async function GET() {
  try {
    // 测试 Firestore 连接
    await adminDb.listCollections();

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        firestore: 'connected',
        api: 'running',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

