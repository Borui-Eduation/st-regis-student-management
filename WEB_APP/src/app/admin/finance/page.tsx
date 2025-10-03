'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/pricing';

interface FinanceStats {
  overview: {
    totalRevenue: number;
    paidRevenue: number;
    unpaidRevenue: number;
    paidCount: number;
    unpaidCount: number;
    totalEnrollments: number;
    paymentRate: number;
  };
  byPaymentMethod: Record<string, { count: number; revenue: number }>;
  studentFinance: {
    totalPaid: number;
    totalOwed: number;
    studentsWithDebt: number;
  };
  currency: string;
}

export default function FinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/finance/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">❌ {error}</p>
              <button 
                onClick={fetchStats}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                重试
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, byPaymentMethod, studentFinance } = stats;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">财务管理</h1>
          <p className="text-gray-600 mt-2">实时财务统计和收款管理</p>
        </div>

        {/* 核心财务指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 总收入 */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-sm font-medium">
                总收入
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPrice(overview.totalRevenue, stats.currency)}
              </div>
              <p className="text-white/80 text-sm mt-2">
                {overview.totalEnrollments} 个注册
              </p>
            </CardContent>
          </Card>

          {/* 已收款 */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-sm font-medium">
                已收款
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPrice(overview.paidRevenue, stats.currency)}
              </div>
              <p className="text-white/80 text-sm mt-2">
                {overview.paidCount} 笔 ({overview.paymentRate}%)
              </p>
            </CardContent>
          </Card>

          {/* 待收款 */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-sm font-medium">
                待收款
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPrice(overview.unpaidRevenue, stats.currency)}
              </div>
              <p className="text-white/80 text-sm mt-2">
                {overview.unpaidCount} 笔未付款
              </p>
            </CardContent>
          </Card>

          {/* 欠费学生 */}
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-sm font-medium">
                欠费学生
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {studentFinance.studentsWithDebt}
              </div>
              <p className="text-white/80 text-sm mt-2">
                累计欠费 {formatPrice(studentFinance.totalOwed, stats.currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 支付方式统计 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>支付方式统计</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(byPaymentMethod).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(byPaymentMethod).map(([method, data]) => (
                  <div 
                    key={method}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {getPaymentMethodName(method)}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {data.count} 笔
                      </span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatPrice(data.revenue, stats.currency)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无支付记录
              </div>
            )}
          </CardContent>
        </Card>

        {/* 学生财务概览 */}
        <Card>
          <CardHeader>
            <CardTitle>学生财务概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">累计已收</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(studentFinance.totalPaid, stats.currency)}
                </div>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">累计欠费</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(studentFinance.totalOwed, stats.currency)}
                </div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">欠费学生数</div>
                <div className="text-2xl font-bold text-red-600">
                  {studentFinance.studentsWithDebt} 人
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <div className="mt-8 flex gap-4">
          <a
            href="/admin/finance/unpaid"
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            📋 查看欠费名单
          </a>
          <button
            onClick={fetchStats}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            🔄 刷新数据
          </button>
        </div>
      </div>
    </div>
  );
}

function getPaymentMethodName(method: string): string {
  const names: Record<string, string> = {
    credit_card: '💳 信用卡',
    wechat: '💚 微信支付',
    alipay: '💙 支付宝',
    emt: '🏦 EMT',
    manual: '📝 手动支付',
  };
  return names[method] || method;
}



