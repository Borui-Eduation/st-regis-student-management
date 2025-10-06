/**
 * Teacher Performance Detail Page
 * 教师查看和编辑学生在特定课程中的成绩表现
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import type { Enrollment } from '@/types';

export default function PerformancePage() {
  const t = useTranslations('pages.performance');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const enrollmentId = params.id as string;
  
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    midtermMark: '',
    midtermComments: '',
    finalGrade: '',
    finalComments: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && !['teacher', 'admin', 'superadmin'].includes(session?.user?.role || '')) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && enrollmentId) {
      fetchEnrollment();
    }
  }, [session, enrollmentId]);

  const fetchEnrollment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/enrollments/${enrollmentId}`);
      const data = await res.json();

      if (data.success) {
        setEnrollment(data.data);
        setFormData({
          midtermMark: data.data.midtermMark?.toString() || '',
          midtermComments: data.data.midtermComments || '',
          finalGrade: data.data.finalGrade?.toString() || '',
          finalComments: data.data.finalComments || '',
        });
      } else {
        toast({
          title: '❌ ' + t('errors.loadFailed'),
          description: data.error || t('errors.cannotLoadEnrollment'),
          variant: 'destructive',
        });
        router.back();
      }
    } catch (error: any) {
      toast({
        title: '❌ ' + t('errors.loadError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!enrollment) return;

    // 验证成绩范围
    if (formData.midtermMark && (parseFloat(formData.midtermMark) < 0 || parseFloat(formData.midtermMark) > 100)) {
      toast({
        title: '❌ ' + t('errors.validationFailed'),
        description: t('errors.midtermRange'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.finalGrade && (parseFloat(formData.finalGrade) < 0 || parseFloat(formData.finalGrade) > 100)) {
      toast({
        title: '❌ ' + t('errors.validationFailed'),
        description: t('errors.finalRange'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        midtermMark: formData.midtermMark ? parseFloat(formData.midtermMark) : null,
        midtermComments: formData.midtermComments || null,
        finalGrade: formData.finalGrade ? parseFloat(formData.finalGrade) : null,
        finalComments: formData.finalComments || null,
      };

      const res = await fetch(`/api/admin/enrollments/${enrollment.enrollmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errors.updateFailed'));
      }

      toast({
        title: '✅ ' + t('saveSuccess.title'),
        description: t('saveSuccess.description'),
      });

      setIsEditing(false);
      fetchEnrollment(); // 重新获取最新数据
    } catch (error: any) {
      toast({
        title: '❌ ' + t('errors.saveFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // 恢复原始数据
    if (enrollment) {
      setFormData({
        midtermMark: enrollment.midtermMark?.toString() || '',
        midtermComments: enrollment.midtermComments || '',
        finalGrade: enrollment.finalGrade?.toString() || '',
        finalComments: enrollment.finalComments || '',
      });
    }
    setIsEditing(false);
  };

  // 状态显示
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '⏳ 待审批', className: 'bg-yellow-100 text-yellow-800' },
      ready: { label: '✅ 待开课', className: 'bg-blue-100 text-blue-800' },
      open: { label: '🎉 已开课', className: 'bg-green-100 text-green-800' },
      rejected: { label: '❌ 已拒绝', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-800' 
    };
    
    return (
      <Badge variant="default" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return null;
  }

  const canEdit = enrollment.status === 'open' && ['teacher', 'admin', 'superadmin'].includes(session?.user?.role || '');

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </Button>
      </div>

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 学生成绩表现
        </h1>
        <p className="text-gray-600">
          查看和管理学生在课程中的期中、期末成绩及评语
        </p>
      </div>

      {/* 学生和课程信息卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 学生信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              学生信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">姓名</div>
              <div className="text-lg font-semibold text-gray-900">{enrollment.studentName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">邮箱</div>
              <div className="text-base text-gray-700">{enrollment.studentEmail || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* 课程信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              课程信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">课程名称</div>
              <div className="text-lg font-semibold text-blue-600">{enrollment.courseName}</div>
              {enrollment.courseCode && (
                <div className="text-xs text-gray-500 mt-1">{enrollment.courseCode}</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">教师</div>
                <div className="text-base text-gray-700">{enrollment.teacherName || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">状态</div>
                <div>{getStatusBadge(enrollment.status)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">学年</div>
                <div className="text-base text-gray-700">{enrollment.academicYear}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">学期</div>
                <div className="text-base text-gray-700">{enrollment.semester}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 成绩编辑区域 */}
      <div className="space-y-6">
        {/* 编辑模式切换按钮 */}
        {canEdit && (
          <div className="flex justify-end">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                编辑成绩
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      保存成绩
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 期中成绩卡片 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              期中考试 (Midterm)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="midtermMark" className="text-base">期中成绩 (0-100)</Label>
                  <Input
                    id="midtermMark"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.midtermMark}
                    onChange={(e) => setFormData({ ...formData, midtermMark: e.target.value })}
                    placeholder="85.5"
                    className="mt-2 text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    请输入0-100之间的数字，支持小数
                  </p>
                </div>
                <div>
                  <Label htmlFor="midtermComments" className="text-base">期中评语</Label>
                  <Textarea
                    id="midtermComments"
                    value={formData.midtermComments}
                    onChange={(e) => setFormData({ ...formData, midtermComments: e.target.value })}
                    placeholder="例如：表现优秀，积极参与课堂讨论..."
                    rows={4}
                    className="mt-2 resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-sm text-gray-500 mb-1">成绩</div>
                  {enrollment.midtermMark !== undefined && enrollment.midtermMark !== null ? (
                    <div className="text-4xl font-bold text-blue-600">
                      {enrollment.midtermMark}
                      <span className="text-xl text-gray-500 ml-2">/ 100</span>
                    </div>
                  ) : (
                    <div className="text-2xl text-gray-400">未录入</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">评语</div>
                  {enrollment.midtermComments ? (
                    <div className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {enrollment.midtermComments}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">暂无评语</div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 期末成绩卡片 */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              期末考试 (Final)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="finalGrade" className="text-base">期末成绩 (0-100)</Label>
                  <Input
                    id="finalGrade"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.finalGrade}
                    onChange={(e) => setFormData({ ...formData, finalGrade: e.target.value })}
                    placeholder="92.0"
                    className="mt-2 text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    请输入0-100之间的数字，支持小数
                  </p>
                </div>
                <div>
                  <Label htmlFor="finalComments" className="text-base">期末评语</Label>
                  <Textarea
                    id="finalComments"
                    value={formData.finalComments}
                    onChange={(e) => setFormData({ ...formData, finalComments: e.target.value })}
                    placeholder="例如：全学期表现出色，建议继续保持..."
                    rows={4}
                    className="mt-2 resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-sm text-gray-500 mb-1">成绩</div>
                  {enrollment.finalGrade !== undefined && enrollment.finalGrade !== null ? (
                    <div className="text-4xl font-bold text-green-600">
                      {enrollment.finalGrade}
                      <span className="text-xl text-gray-500 ml-2">/ 100</span>
                    </div>
                  ) : (
                    <div className="text-2xl text-gray-400">未录入</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">评语</div>
                  {enrollment.finalComments ? (
                    <div className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {enrollment.finalComments}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">暂无评语</div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 提示信息 */}
        {!canEdit && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  {enrollment.status !== 'open' 
                    ? '只有状态为"已开课"的课程才能编辑成绩'
                    : '您没有权限编辑此课程的成绩'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

