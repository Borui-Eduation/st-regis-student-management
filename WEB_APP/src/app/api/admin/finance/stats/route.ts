import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { collections } from '@/lib/firebase-admin';
import { tieredCachedFetch } from '@/lib/cache-tiered';
import { CacheTTL } from '@/lib/cache';

/**
 * GET /api/admin/finance/stats
 * 获取财务统计数据
 * 权限：管理员及以上
 * 🚀 已优化：使用两层缓存，大幅减少Firestore读取
 */
export async function GET(req: NextRequest) {
  try {
    // 权限检查：只有管理员、IT、超级管理员可以访问
    await requireRole(['admin', 'superadmin']);

    // 🚀 使用两层缓存
    const financeData = await tieredCachedFetch(
      'finance:stats',
      async () => {
        console.log('📊 从Firestore查询财务统计');
        
        // 获取所有注册记录
        const enrollmentsSnapshot = await collections.enrollments.get();
        const enrollments = enrollmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

    // 统计数据
    let totalRevenue = 0;           // 总收入
    let paidRevenue = 0;            // 已收款
    let unpaidRevenue = 0;          // 待收款
    let paidCount = 0;              // 已付款数量
    let unpaidCount = 0;            // 未付款数量

    // 按支付方式统计
    const byPaymentMethod: Record<string, { count: number; revenue: number }> = {};
    
    // 按课程类别统计
    const byCategory: Record<string, { count: number; revenue: number }> = {};

    enrollments.forEach((enrollment: any) => {
      const payment = enrollment.payment || {};
      const amount = payment.finalPrice || payment.amount || 0;

      totalRevenue += amount;

      if (payment.paid) {
        paidRevenue += amount;
        paidCount++;

        // 按支付方式统计
        const method = payment.method || 'unknown';
        if (!byPaymentMethod[method]) {
          byPaymentMethod[method] = { count: 0, revenue: 0 };
        }
        byPaymentMethod[method].count++;
        byPaymentMethod[method].revenue += amount;
      } else {
        unpaidRevenue += amount;
        unpaidCount++;
      }
    });

        // 获取学生财务统计
        const studentsSnapshot = await collections.students.get();
        const students = studentsSnapshot.docs.map(doc => doc.data());

        const studentFinance = {
          totalPaid: students.reduce((sum, s: any) => sum + (s.totalPaid || 0), 0),
          totalOwed: students.reduce((sum, s: any) => sum + (s.totalOwed || 0), 0),
          studentsWithDebt: students.filter((s: any) => (s.totalOwed || 0) > 0).length,
        };

        return {
          overview: {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            paidRevenue: Math.round(paidRevenue * 100) / 100,
            unpaidRevenue: Math.round(unpaidRevenue * 100) / 100,
            paidCount,
            unpaidCount,
            totalEnrollments: enrollments.length,
            paymentRate: enrollments.length > 0 
              ? Math.round((paidCount / enrollments.length) * 100) 
              : 0,
          },
          byPaymentMethod,
          studentFinance,
          currency: 'CAD',
        };
      },
      {
        l1Ttl: CacheTTL.MEDIUM,     // L1: 5分钟内存缓存
        l2Ttl: CacheTTL.LONG,       // L2: 15分钟Redis缓存
      }
    );

    return NextResponse.json({
      success: true,
      data: financeData,
    });

  } catch (error: any) {
    const isForbidden = error.message?.includes('Forbidden') || error.message?.includes('Unauthorized');
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get finance stats',
        message: 'Finance statistics retrieval failed'
      },
      { status: isForbidden ? 403 : 500 }
    );
  }
}

