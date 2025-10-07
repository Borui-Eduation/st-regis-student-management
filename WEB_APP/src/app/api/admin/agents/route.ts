import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createErrorResponse, createSuccessResponse, validationError } from '@/lib/api-error-handler';
import { tieredCachedFetch } from '@/lib/cache-tiered';
import { CACHE_STRATEGY } from '@/lib/cache';
import { invalidateAgentsCaches } from '@/lib/cache-utils';
import type { ApiResponse, PaginatedResponse } from '@/types';

/**
 * GET /api/admin/agents
 * 获取所有中介列表
 * 权限：管理员及以上
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search') || '';

    const searchLower = search.toLowerCase();
    const response = await tieredCachedFetch(
      `agents:list:${page}:${pageSize}:${searchLower}`,
      async () => {
        const snapshot = await collections.agents.get();
        let allAgents = snapshot.docs.map(doc => ({
          agentId: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        }));
        if (searchLower) {
          allAgents = allAgents.filter((agent: any) =>
            agent.name?.toLowerCase().includes(searchLower) ||
            agent.email?.toLowerCase().includes(searchLower) ||
            agent.phone?.includes(searchLower) ||
            agent.company?.toLowerCase().includes(searchLower)
          );
        }
        allAgents.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        const total = allAgents.length;
        const offset = (page - 1) * pageSize;
        const items = allAgents.slice(offset, offset + pageSize);
        return {
          items,
          total,
          page,
          pageSize,
          hasMore: offset + items.length < total,
        } as PaginatedResponse<any>;
      },
      CACHE_STRATEGY.lists
    );

    return createSuccessResponse(response, 'Agents fetched successfully');
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch agents');
  }
}

/**
 * POST /api/admin/agents
 * 创建新中介
 * 权限：管理员及以上
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const body = await req.json();
    const { name, email, phone, company, commission, status, notes } = body;

    // 验证必填字段
    if (!name) {
      throw validationError('中介名称为必填项');
    }

    // 如果提供了邮箱，检查是否已存在
    if (email) {
      const existingAgent = await collections.agents
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingAgent.empty) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email already in use',
            message: '该邮箱已被使用'
          },
          { status: 409 }
        );
      }
    }

    // 创建中介记录
    const agentData = {
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      commission: commission ? parseFloat(commission) : 0,  // 佣金比例
      status: status || 'active',
      notes: notes || '',
      totalStudents: 0,  // 关联的学生总数
      totalRevenue: 0,   // 总收入（用于佣金计算）
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = collections.agents.doc();
    await docRef.set(agentData);

    const newAgent = {
      agentId: docRef.id,
      ...agentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 失效Agent相关缓存
    await invalidateAgentsCaches();

    return createSuccessResponse(newAgent, 'Agent created successfully', 201);
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to create agent');
  }
}


