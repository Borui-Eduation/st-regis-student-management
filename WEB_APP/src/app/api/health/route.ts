/**
 * 健康检查和性能监控端点
 * 访问: /api/health
 */

import { NextResponse } from 'next/server';
import { RedisConfig } from '@/lib/cache-redis';
import { serverCache } from '@/lib/cache';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // 检查各组件状态
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
      },
      cache: {
        l1: {
          enabled: true,
          size: serverCache.getStats().size,
          status: 'active',
        },
        l2: {
          enabled: RedisConfig.isConfigured(),
          provider: 'Vercel KV (Upstash)',
          status: RedisConfig.isConfigured() ? 'active' : 'disabled',
        },
      },
      performance: {
        responseTime: Date.now() - startTime,
        unit: 'ms',
      },
    };

    return NextResponse.json(health, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
