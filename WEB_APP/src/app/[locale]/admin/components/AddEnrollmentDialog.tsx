/**
 * AddEnrollmentDialog Component
 * 为学生添加课程注册
 * 权限：Admin 和 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import type { Student } from '@/types';

interface Course {
  courseId: string;
  name: string;
  subject: string;
  grade: number | null;
  teacherName: string;
  semester: string;
}

interface AddEnrollmentDialogProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEnrollmentDialog({ student, isOpen, onClose, onSuccess }: AddEnrollmentDialogProps) {
  const { toast } = useToast();
  const t = useTranslations('dialogs.addEnrollment');
  const tCommon = useTranslations('dialogs.common');
  const tStatus = useTranslations('dialogs.changeStatus.statusOptions');
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ready');
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch('/api/courses?pageSize=100');
      const data = await res.json();
      if (data.success && data.data) {
        setCourses(data.data.items || []);
      } else {
        setCourses([]);
      }
    } catch (error) {
      toast({
        title: t('errors.addFailed'),
        variant: 'destructive',
      });
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !selectedCourseId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.studentId,
          courseId: selectedCourseId,
          status: selectedStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || t('errors.addFailed'));
      }

      toast({
        title: t('success'),
        description: student.name,
      });

      onSuccess?.();
      onClose();
      setSelectedCourseId('');
      setSelectedStatus('ready');
    } catch (error: any) {
      toast({
        title: t('errors.addFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {student?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="course">{t('selectCourse')} *</Label>
              {loadingCourses ? (
                <div className="text-sm text-gray-500 py-2">{tCommon('loading')}</div>
              ) : (
                <select
                  id="course"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">-- {t('selectCourse')} --</option>
                  {courses.map((course) => (
                    <option 
                      key={course.courseId} 
                      value={course.courseId}
                      title={`${course.name} - ${course.teacherName} (${course.subject} G${course.grade})`}
                    >
                      {course.name} - {course.teacherName} ({course.subject} G{course.grade})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {courses.length} {t('selectCourse')}
              </p>
            </div>

            <div>
              <Label htmlFor="status">{t('status')} *</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="pending">{tStatus('pending.label')}</option>
                <option value="ready">{tStatus('ready.label')}</option>
                <option value="open">{tStatus('open.label')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedCourseId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? tCommon('creating') : tCommon('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}