/**
 * Agent Enrollments API
 * GET /api/agent/enrollments
 * 返回当前中介学生的注册记录
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

    let enrollments = [];

    if (session.user.role === 'superadmin') {
      // Superadmin可以看所有注册记录
      const snapshot = await collections.enrollments
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      
      enrollments = snapshot.docs.map(doc => ({
        enrollmentId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      }));
    } else {
      // 🚀 优化：从session中获取agentId，避免每次查询
      const agentId = session.user.agentId;

      if (!agentId) {
        return NextResponse.json(
          { success: false, error: 'Agent profile not found in session' },
          { status: 404 }
        );
      }

      console.log(`📊 Agent ${session.user.email} 查询注册记录 (agentId: ${agentId})`);

      // 获取该agent的所有学生
      const studentsSnapshot = await collections.students
        .where('agentId', '==', agentId)
        .get();

      const studentIds = studentsSnapshot.docs.map(doc => doc.id);

      if (studentIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No enrollments found',
        });
      }

      // 获取这些学生的注册记录（批量查询）
      // Firestore 的 'in' 查询最多支持10个值，需要分批
      const chunkSize = 10;
      const chunks = [];
      
      for (let i = 0; i < studentIds.length; i += chunkSize) {
        chunks.push(studentIds.slice(i, i + chunkSize));
      }

      const allEnrollments = [];
      for (const chunk of chunks) {
        const snapshot = await collections.enrollments
          .where('studentId', 'in', chunk)
          .orderBy('createdAt', 'desc')
          .get();
        
        const chunkEnrollments = snapshot.docs.map(doc => ({
          enrollmentId: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        }));
        
        allEnrollments.push(...chunkEnrollments);
      }

      enrollments = allEnrollments;
    }

    return NextResponse.json({
      success: true,
      data: enrollments,
      message: 'Enrollments fetched successfully',
    });

  } catch (error: any) {
    console.error('Error fetching agent enrollments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

