/**
 * ChangeStatusDialog Component
 * 更改课程注册状态对话框
 * 权限：仅 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import type { Enrollment, EnrollmentStatus } from '@/types';

interface ChangeStatusDialogProps {
  enrollment: Enrollment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// 状态选项配置
const STATUS_OPTIONS: { value: EnrollmentStatus; label: string; description: string; color: string }[] = [
  {
    value: 'pending',
    label: '⏳ 待审批',
    description: '等待管理员审批',
    color: 'text-yellow-600'
  },
  {
    value: 'ready',
    label: '✅ 待开课',
    description: '已批准，等待开课',
    color: 'text-blue-600'
  },
  {
    value: 'open',
    label: '🎉 已开课',
    description: '课程已开课，学生可以上课',
    color: 'text-green-600'
  },
  {
    value: 'rejected',
    label: '❌ 已拒绝',
    description: '注册申请被拒绝',
    color: 'text-red-600'
  }
];

export function ChangeStatusDialog({ enrollment, isOpen, onClose, onSuccess }: ChangeStatusDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<EnrollmentStatus | ''>('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (enrollment && isOpen) {
      setNewStatus(enrollment.status);
      setComments('');
    }
  }, [enrollment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment || !newStatus) return;

    // 如果状态没有改变
    if (newStatus === enrollment.status) {
      toast({
        title: '⚠️ 无需更改',
        description: '状态未发生变化',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        status: newStatus,
        statusChangeComment: comments || `状态从 ${enrollment.status} 更改为 ${newStatus}`,
      };

      const res = await fetch(`/api/admin/enrollments/${enrollment.enrollmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '更新失败');
      }

      toast({
        title: '✅ 状态已更新',
        description: `课程状态已从 "${enrollment.status}" 更改为 "${newStatus}"`,
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

  const currentStatusConfig = STATUS_OPTIONS.find(opt => opt.value === enrollment.status);
  const selectedStatusConfig = STATUS_OPTIONS.find(opt => opt.value === newStatus);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>更改课程注册状态</DialogTitle>
          <DialogDescription>
            为 <span className="font-semibold text-gray-900">{enrollment.studentName}</span> 在课程 
            <span className="font-semibold text-blue-600"> {enrollment.courseName}</span> 中更改注册状态
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 当前状态显示 */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">当前状态</div>
            <div className={`text-lg font-semibold ${currentStatusConfig?.color}`}>
              {currentStatusConfig?.label}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {currentStatusConfig?.description}
            </div>
          </div>

          {/* 新状态选择 */}
          <div className="space-y-3">
            <Label htmlFor="status" className="text-base">选择新状态 *</Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as EnrollmentStatus)}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="请选择状态" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className={`font-medium ${option.color}`}>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* 新状态预览 */}
            {selectedStatusConfig && newStatus !== enrollment.status && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-sm text-blue-800">
                  将更改为: <span className={`font-semibold ${selectedStatusConfig.color}`}>
                    {selectedStatusConfig.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 备注 */}
          <div className="space-y-3">
            <Label htmlFor="comments" className="text-base">更改原因/备注</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="例如：学生已完成支付，批准开课..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              该备注将记录在审批历史中
            </p>
          </div>

          {/* 课程信息概览 */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">课程信息</h4>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>学生: {enrollment.studentName}</div>
              <div>课程: {enrollment.courseName}</div>
              <div>教师: {enrollment.teacherName || '-'}</div>
              <div>学期: {enrollment.academicYear} - {enrollment.semester}</div>
            </div>
          </div>

          {/* 状态更改警告 */}
          {newStatus && newStatus !== enrollment.status && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <div className="font-semibold mb-1">⚠️ 请确认状态更改</div>
                  <ul className="list-disc list-inside space-y-1">
                    {newStatus === 'open' && (
                      <li>更改为"已开课"后，学生可以开始上课</li>
                    )}
                    {newStatus === 'rejected' && (
                      <li>更改为"已拒绝"后，学生将收到拒绝通知</li>
                    )}
                    {newStatus === 'pending' && (
                      <li>更改为"待审批"后，需要重新审批流程</li>
                    )}
                    {newStatus === 'ready' && (
                      <li>更改为"待开课"后，课程等待开课通知</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
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
              disabled={loading || !newStatus || newStatus === enrollment.status}
            >
              {loading ? '更新中...' : '🔄 确认更改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

