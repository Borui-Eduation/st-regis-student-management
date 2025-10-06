/**
 * ChangeStatusDialog Component
 * 更改课程注册状态对话框
 * 权限：仅 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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

export function ChangeStatusDialog({ enrollment, isOpen, onClose, onSuccess }: ChangeStatusDialogProps) {
  const { toast } = useToast();
  const t = useTranslations('dialogs.changeStatus');
  const tCommon = useTranslations('dialogs.common');
  
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<EnrollmentStatus | ''>('');
  const [comments, setComments] = useState('');

  const statusOptions: EnrollmentStatus[] = ['pending', 'ready', 'open', 'rejected'];

  useEffect(() => {
    if (enrollment && isOpen) {
      setNewStatus(enrollment.status);
      setComments('');
    }
  }, [enrollment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment || !newStatus) return;

    if (newStatus === enrollment.status) {
      toast({
        title: t('noChange'),
        description: t('statusUnchanged'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        status: newStatus,
        statusChangeComment: comments || `${t('currentStatus')}: ${enrollment.status} → ${newStatus}`,
      };

      const res = await fetch(`/api/admin/enrollments/${enrollment.enrollmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errors.updateFailed'));
      }

      toast({
        title: t('success'),
        description: t('successDesc', { from: enrollment.status, to: newStatus }),
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: t('errors.updateFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!enrollment) return null;

  const getStatusLabel = (status: EnrollmentStatus) => {
    return t(`statusOptions.${status}.label`);
  };

  const getStatusDescription = (status: EnrollmentStatus) => {
    return t(`statusOptions.${status}.description`);
  };

  const getStatusColor = (status: EnrollmentStatus) => {
    const colors: Record<EnrollmentStatus, string> = {
      pending: 'text-yellow-600',
      ready: 'text-blue-600',
      open: 'text-green-600',
      rejected: 'text-red-600'
    };
    return colors[status];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {enrollment.studentName} - {enrollment.courseName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">{t('currentStatus')}</div>
            <div className={`text-lg font-semibold ${getStatusColor(enrollment.status)}`}>
              {getStatusLabel(enrollment.status)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getStatusDescription(enrollment.status)}
            </div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-3">
            <Label htmlFor="status" className="text-base">{t('newStatus')} *</Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as EnrollmentStatus)}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder={t('selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex flex-col">
                      <span className={`font-medium ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getStatusDescription(status)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* New Status Preview */}
            {newStatus && newStatus !== enrollment.status && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-sm text-blue-800">
                  {t('confirmChange')}: <span className={`font-semibold ${getStatusColor(newStatus)}`}>
                    {getStatusLabel(newStatus)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <Label htmlFor="comments" className="text-base">{t('comments')}</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t('commentsPlaceholder')}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {t('commentsHint')}
            </p>
          </div>

          {/* Course Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">{t('courseInfo')}</h4>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>{t('student')}: {enrollment.studentName}</div>
              <div>{t('course')}: {enrollment.courseName}</div>
              <div>{t('teacher')}: {enrollment.teacherName || '-'}</div>
              <div>{t('semester')}: {enrollment.academicYear} - {enrollment.semester}</div>
            </div>
          </div>

          <DialogFooter className="gap-3">
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
              disabled={loading || !newStatus || newStatus === enrollment.status}
            >
              {loading ? tCommon('saving') : t('confirmChange')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}