/**
 * StudentDetailDialog Component
 * 学生详细信息对话框
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Student, StudentEnrollment } from '../types';

interface StudentDetailDialogProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentDetailDialog({ student, isOpen, onClose }: StudentDetailDialogProps) {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      fetchEnrollments(student.studentId);
    }
  }, [student, isOpen]);

  const fetchEnrollments = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/enrollments`);
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>学生详细信息</DialogTitle>
              <DialogDescription>完整的学生资料和注册信息</DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">姓名</label>
                <p className="text-sm font-medium text-gray-900">{student.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">学生ID</label>
                <p className="text-sm font-mono text-gray-900">{student.studentId}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">邮箱</label>
                <p className="text-sm text-gray-900">{student.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">学校</label>
                <p className="text-sm text-gray-900">{(student as any).school || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">账户状态</label>
                <div className="mt-1">
                  <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                    {student.status === 'active' ? '活跃' : student.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">注册时间</label>
                <p className="text-sm text-gray-900">
                  {student.enrollmentDate
                    ? new Date(student.enrollmentDate).toLocaleDateString('zh-CN')
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Courses List */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">注册课程列表</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-sm text-gray-600">加载课程中...</p>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">暂无课程注册</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.enrollmentId}
                    className="bg-white rounded-lg p-4 border border-purple-200 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{enrollment.courseName}</h4>
                        <p className="text-sm text-gray-600 mt-1">教师: {enrollment.teacherName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {enrollment.academicYear} · {enrollment.semester}
                        </p>
                      </div>
                      <Badge
                        variant={
                          enrollment.status === 'open' ? 'success' :
                          enrollment.status === 'ready' ? 'default' :
                          enrollment.status === 'pending' ? 'warning' :
                          'error'
                        }
                        className={enrollment.status === 'ready' ? 'bg-blue-100 text-blue-800' : ''}
                      >
                        {enrollment.status === 'pending' ? '⏳ 待审批' :
                         enrollment.status === 'ready' ? '✅ 待开课' :
                         enrollment.status === 'open' ? '🎉 已开课' :
                         '❌ 已拒绝'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Stats */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">课程统计</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {student.currentCourses || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">当前课程</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {student.completedCourses || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(student.currentCourses || 0) + (student.completedCourses || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">总课程</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              编辑学生信息
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



