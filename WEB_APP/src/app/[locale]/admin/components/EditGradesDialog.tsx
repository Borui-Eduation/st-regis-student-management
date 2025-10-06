/**
 * EditGradesDialog Component
 * 编辑学生成绩和评语对话框
 * 权限：Admin、Superadmin 和 Teacher
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import type { Enrollment } from '@/types';

interface EditGradesDialogProps {
  enrollment: Enrollment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditGradesDialog({ enrollment, isOpen, onClose, onSuccess }: EditGradesDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    midtermMark: '',
    midtermComments: '',
    finalGrade: '',
    finalComments: '',
  });

  useEffect(() => {
    if (enrollment && isOpen) {
      setFormData({
        midtermMark: enrollment.midtermMark?.toString() || '',
        midtermComments: enrollment.midtermComments || '',
        finalGrade: enrollment.finalGrade?.toString() || '',
        finalComments: enrollment.finalComments || '',
      });
    }
  }, [enrollment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;

    // 验证成绩范围
    if (formData.midtermMark && (parseFloat(formData.midtermMark) < 0 || parseFloat(formData.midtermMark) > 100)) {
      toast({
        title: '❌ 验证失败',
        description: '期中成绩必须在0-100之间',
        variant: 'destructive',
      });
      return;
    }

    if (formData.finalGrade && (parseFloat(formData.finalGrade) < 0 || parseFloat(formData.finalGrade) > 100)) {
      toast({
        title: '❌ 验证失败',
        description: '期末成绩必须在0-100之间',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
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
        throw new Error(data.error || '更新失败');
      }

      toast({
        title: '✅ 更新成功',
        description: '学生成绩和评语已更新',
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

  if (!enrollment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑学生成绩和评语</DialogTitle>
          <DialogDescription>
            为 <span className="font-semibold text-gray-900">{enrollment.studentName}</span> 在课程 
            <span className="font-semibold text-blue-600"> {enrollment.courseName}</span> 中添加或修改成绩
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 期中成绩部分 */}
          <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              期中考试 (Midterm)
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="midtermMark">期中成绩 (0-100)</Label>
                <Input
                  id="midtermMark"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.midtermMark}
                  onChange={(e) => setFormData({ ...formData, midtermMark: e.target.value })}
                  placeholder="85.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  请输入0-100之间的数字，支持小数
                </p>
              </div>

              <div>
                <Label htmlFor="midtermComments">期中评语</Label>
                <Textarea
                  id="midtermComments"
                  value={formData.midtermComments}
                  onChange={(e) => setFormData({ ...formData, midtermComments: e.target.value })}
                  placeholder="例如：表现优秀，积极参与课堂讨论..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  对学生的期中表现进行评价
                </p>
              </div>
            </div>
          </div>

          {/* 期末成绩部分 */}
          <div className="space-y-4 border rounded-lg p-4 bg-green-50">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              期末考试 (Final)
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="finalGrade">期末成绩 (0-100)</Label>
                <Input
                  id="finalGrade"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.finalGrade}
                  onChange={(e) => setFormData({ ...formData, finalGrade: e.target.value })}
                  placeholder="92.0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  请输入0-100之间的数字，支持小数
                </p>
              </div>

              <div>
                <Label htmlFor="finalComments">期末评语</Label>
                <Textarea
                  id="finalComments"
                  value={formData.finalComments}
                  onChange={(e) => setFormData({ ...formData, finalComments: e.target.value })}
                  placeholder="例如：全学期表现出色，建议继续保持..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  对学生的整体学期表现进行评价
                </p>
              </div>
            </div>
          </div>

          {/* 课程信息概览 */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-gray-700 mb-2">课程信息</h4>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>学生: {enrollment.studentName}</div>
              <div>课程: {enrollment.courseName}</div>
              <div>教师: {enrollment.teacherName || '-'}</div>
              <div>学期: {enrollment.academicYear} - {enrollment.semester}</div>
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
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '💾 保存成绩'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

