/**
 * Agent Students API
 * GET /api/agent/students
 * 返回当前中介推荐的学生列表
 * 🚀 已优化：从session获取agentId，避免重复查询
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { collections } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // 验证用户身份
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 检查是否是agent角色
    if (session.user.role !== 'agent' && session.user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Agent role required.' },
        { status: 403 }
      );
    }

    // 如果是superadmin，返回所有学生；如果是agent，只返回自己的学生
    let query;
    if (session.user.role === 'superadmin') {
      // Superadmin可以看到所有学生
      query = collections.students.orderBy('createdAt', 'desc');
    } else {
      // 🚀 优化：从session中获取agentId，避免每次查询
      const agentId = session.user.agentId;

      if (!agentId) {
        return NextResponse.json(
          { success: false, error: 'Agent profile not found in session' },
          { status: 404 }
        );
      }

      console.log(`📊 Agent ${session.user.email} 查询自己的学生 (agentId: ${agentId})`);

      // 查询该agent的学生
      query = collections.students
        .where('agentId', '==', agentId)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    
    const students = snapshot.docs.map(doc => ({
      studentId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: students,
      message: 'Students fetched successfully',
    });

  } catch (error: any) {
    console.error('Error fetching agent students:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

