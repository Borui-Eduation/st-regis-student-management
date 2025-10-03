/**
 * Cache Management API
 * 缓存管理接口 - 查看和管理缓存状态
 * 权限：仅超级管理员
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { serverCache } from '@/lib/cache';
import { getCacheStats } from '@/lib/cache-helpers';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

/**
 * GET /api/admin/cache
 * 获取缓存统计信息
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    const stats = getCacheStats();
    
    return createSuccessResponse(stats, 'Cache stats retrieved successfully');
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to get cache stats');
  }
}

/**
 * DELETE /api/admin/cache
 * 清空所有缓存
 */
export async function DELETE(): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['superadmin']);
    
    serverCache.clear();
    
    return createSuccessResponse(null, 'Cache cleared successfully');
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to clear cache');
  }
}

