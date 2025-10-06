/**
 * Teacher Dashboard
 * 教师控制台 - 查看和管理自己的课程和学生
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnrollmentTable } from '@/app/[locale]/admin/components/EnrollmentTable';
import type { Enrollment } from '@/types';

interface TeacherInfo {
  teacherId: string;
  teacherName: string;
  totalCourses: number;
  totalStudents: number;
}

export default function TeacherDashboard() {
  const t = useTranslations('pages.teacher');
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'teacher') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'teacher') {
      fetchEnrollments();
    }
  }, [session, refreshKey]);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/enrollments');
      const data = await res.json();

      if (data.success) {
        setEnrollments(data.data.enrollments || []);
        setTeacherInfo(data.data.teacherInfo);
      } else {
        console.error('Failed to fetch courses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally{
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{tCommon('loading')}...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'teacher') {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 顶部欢迎信息 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          👋 {t('welcome', { name: teacherInfo?.teacherName || session.user.name })}
        </h1>
        <p className="text-gray-600 mt-2">
          {t('subtitle')}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('stats.myCourses')}</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {teacherInfo?.totalCourses || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('stats.totalStudents')}</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {teacherInfo?.totalStudents || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('stats.enrollments')}</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {enrollments.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 课程注册列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('enrollmentList.title')}</CardTitle>
              <CardDescription>
                {t('enrollmentList.description')}
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {tCommon('refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noCourses.title')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('noCourses.message')}
              </p>
            </div>
          ) : (
            <EnrollmentTable
              enrollments={enrollments}
              processing={null}
              onApprove={() => {}}
              onReject={() => {}}
              onRefresh={handleRefresh}
            />
          )}
        </CardContent>
      </Card>

      {/* 快速操作提示 */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">💡 {t('tips.title')}</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                {(t.raw('tips.items') as string[]).map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

