/**
 * CreateCourseDialog Component
 * 创建新课程对话框（同时同步到 Moodle）
 * 权限：仅 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface CreateCourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCourseDialog({ isOpen, onClose, onSuccess }: CreateCourseDialogProps) {
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
    syncToMoodle: true,
  });

  useEffect(() => {
    if (isOpen) {
      // 重置表单
      setFormData({
        courseName: '',
        courseCode: '',
        subject: '',
        category: 'arts',
        gradeLevel: '',
        description: '',
        basePrice: '0',
        academicYear: getCurrentAcademicYear(),
        semester: getCurrentSemester(),
        maxEnrollment: '',
        minEnrollment: '',
        syncToMoodle: true,
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || '创建失败');
      }

      toast({
        title: '✅ 课程创建成功',
        description: data.data.moodleSynced 
          ? `课程已创建并同步到 Moodle (ID: ${data.data.moodleId})`
          : '课程已创建（未同步到 Moodle）',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: '❌ 创建失败',
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新课程</DialogTitle>
          <DialogDescription>
            创建新课程并同步到 Moodle 系统
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
                <p className="text-xs text-gray-500 mt-1">完整的课程名称</p>
              </div>

              <div>
                <Label htmlFor="courseCode">课程代码 * </Label>
                <input
                  id="courseCode"
                  type="text"
                  value={formData.courseCode}
                  onChange={(e) => handleChange('courseCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：PRECALC12"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">唯一标识符（Moodle shortname）</p>
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
            
            <div className="grid grid-cols-2 gap-4">
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
                <p className="text-xs text-gray-500 mt-1">留空表示不限制</p>
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
            </div>
          </div>

          {/* Moodle 同步选项 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <input
                id="syncToMoodle"
                type="checkbox"
                checked={formData.syncToMoodle}
                onChange={(e) => handleChange('syncToMoodle', e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600"
              />
              <div className="flex-1">
                <Label htmlFor="syncToMoodle" className="font-medium text-blue-900">
                  同步到 Moodle
                </Label>
                <p className="text-sm text-blue-700 mt-1">
                  选中后，将在 Moodle 系统中自动创建此课程。课程代码将作为 Moodle shortname。
                </p>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
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
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  创建中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  创建课程
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

function getCurrentSemester(): string {
  const now = new Date();
  const month = now.getMonth() + 1;

  if (month >= 9 || month <= 1) {
    return 'Fall';
  } else if (month >= 2 && month <= 6) {
    return 'Spring';
  } else {
    return 'Summer';
  }
}

