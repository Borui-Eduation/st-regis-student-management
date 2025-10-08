/**
 * 课程管理页面
 * 权限：Admin 和 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CreateCourseDialog } from './components/CreateCourseDialog';
import { EditCourseDialog } from './components/EditCourseDialog';
import { MoodleCourseSyncDialog } from './components/MoodleCourseSyncDialog';
import type { Course } from '@/types';

export default function CoursesManagementPage() {
  const t = useTranslations('pages.courses');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoodleSyncDialog, setShowMoodleSyncDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses?pageSize=1000');
      const data = await res.json();
      
      if (data.success && data.data) {
        setCourses(data.data.items || []);
      }
    } catch (error) {
      toast({
        title: '❌ ' + t('errors.loadFailed'),
        description: t('errors.cannotFetchCourses'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMoodle = async () => {
    if (!confirm(t('confirmSync'))) {
      return;
    }

    setSyncing(true);
    setStats(null);

    try {
      const res = await fetch('/api/admin/courses/sync-moodle', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || t('errors.syncFailed'));
      }

      setStats(data.data);

      toast({
        title: '✅ ' + t('syncSuccess'),
        description: t('syncSuccessDesc', { 
          synced: data.data.synced, 
          created: data.data.created, 
          updated: data.data.updated 
        }),
      });

      // 刷新课程列表
      await fetchCourses();

    } catch (error: any) {
      toast({
        title: '❌ ' + t('errors.syncFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowEditDialog(true);
  };

  const handleSyncFromMoodle = (course: Course) => {
    setSelectedCourse(course);
    setShowMoodleSyncDialog(true);
  };

  const handleDialogClose = () => {
    setShowEditDialog(false);
    setShowMoodleSyncDialog(false);
    setSelectedCourse(null);
  };

  const handleDialogSuccess = () => {
    fetchCourses();
    handleDialogClose();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('createCourse')}
        </Button>
      </div>

      {/* Moodle 同步区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              🔄 {t('moodleSync.title')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('moodleSync.description')}
            </p>

            {stats && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">{t('moodleSync.lastResult')}:</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-blue-600 font-semibold">
                      {stats.totalMoodleCourses}
                    </div>
                    <div className="text-blue-800">{t('moodleSync.stats.moodleCourses')}</div>
                  </div>
                  <div>
                    <div className="text-green-600 font-semibold">
                      {stats.synced}
                    </div>
                    <div className="text-green-800">{t('moodleSync.stats.synced')}</div>
                  </div>
                  <div>
                    <div className="text-emerald-600 font-semibold">
                      {stats.created}
                    </div>
                    <div className="text-emerald-800">{t('moodleSync.stats.created')}</div>
                  </div>
                  <div>
                    <div className="text-amber-600 font-semibold">
                      {stats.updated}
                    </div>
                    <div className="text-amber-800">{t('moodleSync.stats.updated')}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 font-semibold">
                      {stats.skipped}
                    </div>
                    <div className="text-gray-800">{t('moodleSync.stats.skipped')}</div>
                  </div>
                </div>
                {stats.moodleSite && (
                  <p className="text-xs text-blue-700 mt-3">
                    {t('moodleSync.site')}: {stats.moodleSite} ({stats.moodleVersion})
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSyncMoodle}
                disabled={syncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('moodleSync.syncing')}...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('moodleSync.startSync')}
                  </>
                )}
              </Button>

              <div className="text-sm text-gray-500">
                💡 {t('moodleSync.hint')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 课程列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('listTitle')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {tCommon('total', { count: courses.length })}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">{tCommon('loading')}...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noCourses')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('noCoursesHint')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.courseName')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.courseCode')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.grade')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.subject')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.category')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.price')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Moodle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tCommon('status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tCommon('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.courseId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {course.courseName}
                        </div>
                        {course.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {course.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.courseCode || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.gradeLevel ? `Grade ${course.gradeLevel}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {course.category ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            course.category === 'science'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {t(`categories.${course.category}`, { defaultValue: course.category })}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${course.basePrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {course.moodleId ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t('moodleSync.synced')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            {t('manualCreated')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          course.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : course.status === 'archived'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tStatus(course.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleEditCourse(course)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            ✏️ {tCommon('edit')}
                          </Button>
                          <Button
                            onClick={() => handleSyncFromMoodle(course)}
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            title={t('linkMoodleTooltip')}
                          >
                            🔗 {t('linkMoodle')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 创建课程对话框 */}
      <CreateCourseDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={fetchCourses}
      />

      {/* 编辑课程对话框 */}
      <EditCourseDialog
        course={selectedCourse}
        isOpen={showEditDialog}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />

      {/* Moodle同步对话框 */}
      <MoodleCourseSyncDialog
        course={selectedCourse}
        isOpen={showMoodleSyncDialog}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />
      </div>
    </div>
  );
}
