/**
 * POST /api/admin/clear-cache
 * 清除所有缓存
 * 权限：超级管理员
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { invalidateAllAdminCaches } from '@/lib/cache-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    console.log('🧹 清除所有缓存...');
    
    // 使用统一的缓存清除函数
    await invalidateAllAdminCaches();
    
    console.log('✅ 所有缓存已清除');
    
    return createSuccessResponse(
      { cleared: true, timestamp: new Date().toISOString() },
      '缓存已清除'
    );
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to clear cache');
  }
}

