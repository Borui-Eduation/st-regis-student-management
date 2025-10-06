/**
 * AddEnrollmentDialog Component
 * 为学生添加课程注册
 * 权限：Admin 和 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
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
      const res = await fetch('/api/courses?pageSize=100'); // 获取更多课程用于选择
      const data = await res.json();
      if (data.success && data.data) {
        // API返回的是分页数据，需要取items数组
        setCourses(data.data.items || []);
      } else {
        setCourses([]);
      }
    } catch (error) {
      toast({
        title: '❌ 加载课程失败',
        description: '无法获取课程列表',
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
        throw new Error(data.error || data.message || '添加失败');
      }

      toast({
        title: '✅ 添加成功',
        description: `已为 ${student.name} 添加课程`,
      });

      onSuccess?.();
      onClose();
      setSelectedCourseId('');
      setSelectedStatus('ready');
    } catch (error: any) {
      toast({
        title: '❌ 添加失败',
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
          <DialogTitle>为学生添加课程</DialogTitle>
          <DialogDescription>
            为 <strong>{student?.name}</strong> 添加新的课程注册
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="course">选择课程 *</Label>
              {loadingCourses ? (
                <div className="text-sm text-gray-500 py-2">加载课程列表...</div>
              ) : (
                <select
                  id="course"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">-- 请选择课程 --</option>
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
                共 {courses.length} 门可选课程
              </p>
            </div>

            <div>
              <Label htmlFor="status">初始状态 *</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="pending">Pending (待审批)</option>
                <option value="ready">Ready (待开课)</option>
                <option value="open">Open (已开课)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 建议选择 "Ready" - 跳过审批直接进入待开课状态
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">注意事项</h4>
                  <div className="mt-1 text-xs text-blue-700">
                    <ul className="list-disc pl-4 space-y-1">
                      <li>系统会自动计算课程费用</li>
                      <li>默认支付状态为"未支付"</li>
                      <li>学生的课程计数会自动更新</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedCourseId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? '添加中...' : '添加课程'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

