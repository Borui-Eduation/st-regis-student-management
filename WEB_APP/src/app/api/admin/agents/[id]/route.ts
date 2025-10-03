import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections, FieldValue } from '@/lib/firebase-admin';
import { createErrorResponse, createSuccessResponse, notFoundError, validationError } from '@/lib/api-error-handler';
import type { ApiResponse } from '@/types';

// 强制动态渲染 - 不在构建时预渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/agents/[id]
 * 获取单个中介详情
 * 权限：管理员及以上
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);
    
    const { id } = await context.params;
    const doc = await collections.agents.doc(id).get();

    if (!doc.exists) {
      throw notFoundError('中介');
    }

    const data = doc.data();
    const agent = {
      agentId: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
    };

    // 获取该中介关联的学生列表
    const studentsSnapshot = await collections.students
      .where('agentId', '==', id)
      .get();
    
    const students = studentsSnapshot.docs.map(doc => ({
      studentId: doc.id,
      name: doc.data().name,
      email: doc.data().email,
      currentCourses: doc.data().currentCourses || 0,
    }));

    return createSuccessResponse({ agent, students }, 'Agent details fetched successfully');
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to fetch agent details');
  }
}

/**
 * PATCH /api/admin/agents/[id]
 * 更新中介信息
 * 权限：管理员及以上
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const { id } = await context.params;
    const body = await req.json();
    const { name, email, phone, company, commission, status, notes } = body;

    // 检查中介是否存在
    const doc = await collections.agents.doc(id).get();
    if (!doc.exists) {
      throw notFoundError('中介');
    }

    // 如果更新了邮箱，检查是否与其他中介冲突
    if (email && email !== doc.data()?.email) {
      const existingAgent = await collections.agents
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingAgent.empty && existingAgent.docs[0].id !== id) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email already in use',
            message: '该邮箱已被其他中介使用'
          },
          { status: 409 }
        );
      }
    }

    // 准备更新数据
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (company !== undefined) updateData.company = company || null;
    if (commission !== undefined) updateData.commission = parseFloat(commission);
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await collections.agents.doc(id).update(updateData);

    const updatedDoc = await collections.agents.doc(id).get();
    const updatedAgent = {
      agentId: id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: new Date().toISOString(),
    };

    return createSuccessResponse(updatedAgent, 'Agent updated successfully');
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to update agent');
  }
}

/**
 * DELETE /api/admin/agents/[id]
 * 删除中介
 * 权限：管理员及以上
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireRole(['admin', 'superadmin']);

    const { id } = await context.params;
    
    // 检查中介是否存在
    const doc = await collections.agents.doc(id).get();
    if (!doc.exists) {
      throw notFoundError('中介');
    }

    // 检查是否有关联的学生
    const studentsSnapshot = await collections.students
      .where('agentId', '==', id)
      .limit(1)
      .get();

    if (!studentsSnapshot.empty) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete agent with associated students',
          message: '无法删除有关联学生的中介，请先将学生重新分配'
        },
        { status: 400 }
      );
    }

    await collections.agents.doc(id).delete();

    return createSuccessResponse(null, 'Agent deleted successfully');
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to delete agent');
  }
}

