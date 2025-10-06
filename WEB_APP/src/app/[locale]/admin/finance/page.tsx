'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('pages.finance');
  const tCommon = useTranslations('common');
  const tPayment = useTranslations('payment');
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
        setError(result.error || t('errors.fetchFailed'));
      }
    } catch (err) {
      setError(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="w-full mx-auto px-6">
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
        <div className="w-full mx-auto px-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">❌ {error}</p>
              <button 
                onClick={fetchStats}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {t('retry')}
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
      <div className="w-full mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>

        {/* 核心财务指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 总收入 */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-sm font-medium">
                {t('stats.totalRevenue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPrice(overview.totalRevenue, stats.currency)}
              </div>
              <p className="text-white/80 text-sm mt-2">
                {overview.totalEnrollments} {t('stats.enrollments')}
              </p>
            </CardContent>
          </Card>

          {/* 已收款 */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-sm font-medium">
                {t('stats.paidRevenue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPrice(overview.paidRevenue, stats.currency)}
              </div>
              <p className="text-white/80 text-sm mt-2">
                {overview.paidCount} {t('stats.payments')} ({overview.paymentRate}%)
              </p>
            </CardContent>
          </Card>

          {/* 待收款 */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-sm font-medium">
                {t('stats.unpaidRevenue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPrice(overview.unpaidRevenue, stats.currency)}
              </div>
              <p className="text-white/80 text-sm mt-2">
                {overview.unpaidCount} {t('stats.unpaid')}
              </p>
            </CardContent>
          </Card>

          {/* 欠费学生 */}
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader>
              <CardTitle className="text-white/90 text-sm font-medium">
                {t('stats.studentsWithDebt')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {studentFinance.studentsWithDebt}
              </div>
              <p className="text-white/80 text-sm mt-2">
                {t('stats.totalOwed')} {formatPrice(studentFinance.totalOwed, stats.currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 支付方式统计 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('paymentMethods.title')}</CardTitle>
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
                        {tPayment(`methods.${method}`)}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {data.count} {t('stats.payments')}
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
                {t('paymentMethods.noRecords')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 学生财务概览 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('studentOverview.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">{t('studentOverview.totalPaid')}</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(studentFinance.totalPaid, stats.currency)}
                </div>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">{t('studentOverview.totalOwed')}</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(studentFinance.totalOwed, stats.currency)}
                </div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">{t('studentOverview.studentsWithDebt')}</div>
                <div className="text-2xl font-bold text-red-600">
                  {studentFinance.studentsWithDebt}
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
            📋 {t('actions.viewUnpaid')}
          </a>
          <button
            onClick={fetchStats}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            🔄 {tCommon('refresh')}
          </button>
        </div>
      </div>
    </div>
  );
}


