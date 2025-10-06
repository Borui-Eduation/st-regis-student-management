'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/pricing';

interface UnpaidEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  teacherName: string;
  payment: {
    paid: boolean;
    amount: number;
    finalPrice: number;
    method: string;
  };
  createdAt: any;
}

interface StudentDebt {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalOwed: number;
  enrollments: UnpaidEnrollment[];
}

export default function UnpaidPage() {
  const t = useTranslations('pages.unpaid');
  const tCommon = useTranslations('common');
  const tPayment = useTranslations('payment');
  const [debtList, setDebtList] = useState<StudentDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Record<string, string>>({});
  const [transactionIds, setTransactionIds] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUnpaid();
  }, []);

  const fetchUnpaid = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/finance/unpaid');
      const result = await response.json();
      
      if (result.success) {
        setDebtList(result.data.studentDebts || []);
      }
    } catch (err) {
      console.error('Failed to fetch unpaid:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (enrollmentId: string, amount: number) => {
    const method = selectedMethod[enrollmentId] || 'manual';
    const transactionId = transactionIds[enrollmentId] || '';

    try {
      setMarkingPaid(enrollmentId);
      const response = await fetch('/api/admin/finance/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          paymentMethod: method,
          transactionId,
          amount,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(t('markPaidSuccess'));
        fetchUnpaid(); // 刷新列表
      } else {
        alert(t('markPaidFailed') + ': ' + result.error);
      }
    } catch (err) {
      alert(t('networkError'));
    } finally {
      setMarkingPaid(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="w-full mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalOwed = debtList.reduce((sum, student) => sum + student.totalOwed, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>

        {/* 汇总 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-700">{t('stats.totalOwed')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {formatPrice(totalOwed, 'CAD')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">{t('stats.studentsCount')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {debtList.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">{t('stats.unpaidCourses')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {debtList.reduce((sum, s) => sum + s.enrollments.length, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 学生列表 */}
        {debtList.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-xl font-semibold text-gray-700">{t('allPaid.title')}</p>
                <p className="text-gray-500 mt-2">{t('allPaid.message')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {debtList.map((student) => (
              <Card key={student.studentId} className="border-l-4 border-l-orange-500">
                <CardHeader className="bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{student.studentName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{student.studentEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{t('totalOwed')}</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPrice(student.totalOwed, 'CAD')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {student.enrollments.map((enrollment) => (
                      <div 
                        key={enrollment.id}
                        className="p-4 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {enrollment.courseName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {t('teacher')}: {enrollment.teacherName}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">
                              {formatPrice(enrollment.payment.finalPrice || enrollment.payment.amount, 'CAD')}
                            </div>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              {tPayment('unpaid')}
                            </span>
                          </div>
                        </div>

                        {/* 支付方式选择和交易ID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {tPayment('paymentMethod')}
                            </label>
                            <select
                              value={selectedMethod[enrollment.id] || 'manual'}
                              onChange={(e) => setSelectedMethod({
                                ...selectedMethod,
                                [enrollment.id]: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="manual">{tPayment('methods.manual')}</option>
                              <option value="credit_card">{tPayment('methods.credit_card')}</option>
                              <option value="wechat">{tPayment('methods.wechat')}</option>
                              <option value="alipay">{tPayment('methods.alipay')}</option>
                              <option value="emt">{tPayment('methods.emt')}</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('transactionId')}
                            </label>
                            <input
                              type="text"
                              placeholder={t('transactionIdPlaceholder')}
                              value={transactionIds[enrollment.id] || ''}
                              onChange={(e) => setTransactionIds({
                                ...transactionIds,
                                [enrollment.id]: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => markAsPaid(
                            enrollment.id, 
                            enrollment.payment.finalPrice || enrollment.payment.amount
                          )}
                          disabled={markingPaid === enrollment.id}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                            markingPaid === enrollment.id
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {markingPaid === enrollment.id ? tCommon('processing') : t('markAsPaid')}
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-8 flex gap-4">
          <a
            href="/admin/finance"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            ← {t('backToFinance')}
          </a>
          <button
            onClick={fetchUnpaid}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            🔄 {tCommon('refresh')}
          </button>
        </div>
      </div>
    </div>
  );
}



