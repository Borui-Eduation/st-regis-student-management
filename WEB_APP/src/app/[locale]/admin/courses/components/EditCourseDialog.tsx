/**
 * EditCourseDialog Component
 * 编辑课程信息对话框
 * 权限：仅 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import type { Course } from '@/types';

interface EditCourseDialogProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditCourseDialog({ course, isOpen, onClose, onSuccess }: EditCourseDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    subject: '',
    category: 'arts' as 'arts' | 'science',
    gradeLevel: '',
    description: '',
    basePrice: '0',
    academicYear: '',
    semester: 'Fall',
    maxEnrollment: '',
    minEnrollment: '',
    status: 'active' as 'active' | 'archived' | 'cancelled',
  });

  useEffect(() => {
    if (isOpen && course) {
      // 加载课程数据到表单
      setFormData({
        courseName: course.courseName || '',
        courseCode: course.courseCode || '',
        subject: course.subject || '',
        category: course.category || 'arts',
        gradeLevel: course.gradeLevel?.toString() || '',
        description: course.description || '',
        basePrice: course.basePrice?.toString() || '0',
        academicYear: course.academicYear || '',
        semester: course.semester || 'Fall',
        maxEnrollment: course.maxEnrollment?.toString() || '',
        minEnrollment: course.minEnrollment?.toString() || '',
        status: course.status || 'active',
      });
    }
  }, [isOpen, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || '更新失败');
      }

      toast({
        title: '✅ 课程更新成功',
        description: `课程 "${formData.courseName}" 已更新`,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: '❌ 更新失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!course) return;

    if (!confirm(`确定要删除课程 "${course.courseName}" 吗？\n\n如果有学生已注册该课程，课程将被归档而不是删除。`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.courseId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || '删除失败');
      }

      toast({
        title: '✅ 操作成功',
        description: data.message?.includes('archived') 
          ? '课程已归档（有学生注册）' 
          : '课程已删除',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: '❌ 删除失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑课程</DialogTitle>
          <DialogDescription>
            修改课程信息（课程ID: {course.courseId}）
            {course.moodleId && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                🔗 已关联Moodle (ID: {course.moodleId})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">基本信息</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courseName">课程名称 *</Label>
                <input
                  id="courseName"
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => handleChange('courseName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：Pre Calculus 12"
                  required
                />
              </div>

              <div>
                <Label htmlFor="courseCode">课程代码 *</Label>
                <input
                  id="courseCode"
                  type="text"
                  value={formData.courseCode}
                  onChange={(e) => handleChange('courseCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：PRECALC12"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject">科目</Label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：Mathematics"
                />
              </div>

              <div>
                <Label htmlFor="category">课程类别 *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="arts">文科 (Arts)</option>
                  <option value="science">理科 (Science)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="gradeLevel">年级</Label>
                <input
                  id="gradeLevel"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.gradeLevel}
                  onChange={(e) => handleChange('gradeLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">课程描述</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="课程简介和说明..."
              />
            </div>
          </div>

          {/* 学期和定价 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">学期和定价</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="academicYear">学年</Label>
                <input
                  id="academicYear"
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => handleChange('academicYear', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2025-2026"
                />
              </div>

              <div>
                <Label htmlFor="semester">学期</Label>
                <select
                  id="semester"
                  value={formData.semester}
                  onChange={(e) => handleChange('semester', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>

              <div>
                <Label htmlFor="basePrice">基础价格 (CAD)</Label>
                <input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleChange('basePrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* 招生设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">招生设置</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxEnrollment">最大人数</Label>
                <input
                  id="maxEnrollment"
                  type="number"
                  min="1"
                  value={formData.maxEnrollment}
                  onChange={(e) => handleChange('maxEnrollment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="不限制"
                />
              </div>

              <div>
                <Label htmlFor="minEnrollment">最小开课人数</Label>
                <input
                  id="minEnrollment"
                  type="number"
                  min="1"
                  value={formData.minEnrollment}
                  onChange={(e) => handleChange('minEnrollment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="不限制"
                />
              </div>

              <div>
                <Label htmlFor="status">课程状态</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">活跃</option>
                  <option value="archived">已归档</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              🗑️ 删除课程
            </Button>

            <div className="flex gap-3">
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
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </>
                ) : (
                  <>
                    💾 保存修改
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
