/**
 * MoodleCourseSyncDialog Component
 * 选择Moodle课程并关联到本地课程对话框
 * 权限：仅 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import type { Course } from '@/types';

interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  categoryid?: number;
  summary?: string;
}

interface MoodleCourseSyncDialogProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MoodleCourseSyncDialog({ course, isOpen, onClose, onSuccess }: MoodleCourseSyncDialogProps) {
  const { toast } = useToast();
  const t = useTranslations('dialogs.moodleSync');
  const tCommon = useTranslations('dialogs.common');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [moodleCourses, setMoodleCourses] = useState<MoodleCourse[]>([]);
  const [selectedMoodleCourseId, setSelectedMoodleCourseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMoodleCourses();
    }
  }, [isOpen]);

  const fetchMoodleCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses/moodle-list');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || t('errors.syncFailed'));
      }

      setMoodleCourses(data.data.courses || []);
      
      toast({
        title: t('success'),
      });
    } catch (error: any) {
      toast({
        title: t('errors.syncFailed'),
        description: error.message,
        variant: 'destructive',
      });
      setMoodleCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!course || !selectedMoodleCourseId) {
      toast({
        title: '⚠️  请选择Moodle课程',
        description: '需要选择一个Moodle课程进行同步',
        variant: 'destructive',
      });
      return;
    }

    const selectedMoodle = moodleCourses.find(mc => mc.id === selectedMoodleCourseId);
    if (!selectedMoodle) return;

    if (!confirm(
      `确定要用Moodle课程覆盖本地课程吗？\n\n` +
      `本地课程: ${course.courseName}\n` +
      `Moodle课程: ${selectedMoodle.fullname}\n\n` +
      `这将更新课程名称、代码、科目等信息，但会保留价格和教师信息。`
    )) {
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.courseId}/sync-from-moodle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodleCourseId: selectedMoodleCourseId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || '同步失败');
      }

      toast({
        title: '✅ 同步成功',
        description: `课程已关联到Moodle课程 "${selectedMoodle.fullname}"`,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: '❌ 同步失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const filteredMoodleCourses = moodleCourses.filter(mc => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      mc.fullname.toLowerCase().includes(term) ||
      mc.shortname.toLowerCase().includes(term)
    );
  });

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>关联Moodle课程</DialogTitle>
          <DialogDescription>
            选择一个Moodle课程，用其数据覆盖本地课程信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 当前课程信息 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">当前本地课程：</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">课程名称：</span>
                <span className="font-medium">{course.courseName}</span>
              </div>
              <div>
                <span className="text-gray-600">课程代码：</span>
                <span className="font-medium">{course.courseCode || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">科目：</span>
                <span className="font-medium">{course.subject}</span>
              </div>
              <div>
                <span className="text-gray-600">类别：</span>
                <span className="font-medium">{course.category === 'science' ? '理科' : '文科'}</span>
              </div>
            </div>
            {course.moodleId && (
              <div className="mt-2 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  🔗 已关联Moodle (ID: {course.moodleId})
                </span>
              </div>
            )}
          </div>

          {/* 搜索框 */}
          <div>
            <Label htmlFor="search">搜索Moodle课程</Label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入课程名称或代码搜索..."
              disabled={loading}
            />
          </div>

          {/* Moodle课程列表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>选择Moodle课程</Label>
              {loading ? (
                <span className="text-sm text-gray-500">加载中...</span>
              ) : (
                <span className="text-sm text-gray-500">
                  找到 {filteredMoodleCourses.length} 门课程
                </span>
              )}
            </div>

            <div className="border border-gray-300 rounded-md overflow-hidden">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-2">加载Moodle课程...</p>
                </div>
              ) : filteredMoodleCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? '未找到匹配的课程' : '没有可用的Moodle课程'}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          选择
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          课程名称
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          课程代码
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Moodle ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMoodleCourses.map((moodleCourse) => (
                        <tr
                          key={moodleCourse.id}
                          onClick={() => setSelectedMoodleCourseId(moodleCourse.id)}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedMoodleCourseId === moodleCourse.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="radio"
                              checked={selectedMoodleCourseId === moodleCourse.id}
                              onChange={() => setSelectedMoodleCourseId(moodleCourse.id)}
                              className="h-4 w-4 text-blue-600"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {moodleCourse.fullname}
                            </div>
                            {moodleCourse.summary && (
                              <div className="text-xs text-gray-500 truncate max-w-md">
                                {moodleCourse.summary.replace(/<[^>]*>/g, '').substring(0, 100)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {moodleCourse.shortname}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {moodleCourse.id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">⚠️  同步说明：</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 同步后，课程名称、代码、科目等信息将被Moodle数据覆盖</li>
              <li>• 价格、教师、学期等本地信息将被保留</li>
              <li>• 课程将自动关联到选定的Moodle课程</li>
              <li>• 此操作不会影响已有的学生注册记录</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={syncing}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSync}
              disabled={syncing || !selectedMoodleCourseId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('syncing')}
                </>
              ) : (
                <>
                  🔗 {t('syncNow')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
