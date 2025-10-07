/**
 * CreateStudentDialog Component
 * 创建新学生对话框
 * 权限：Admin 和 Superadmin
 * 
 * ⚠️ 注意：此组件仅用于创建学生账号
 * 创建管理员、教师、中介等系统用户请前往超级管理员页面 (/superadmin)
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface CreateStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateStudentDialog({ isOpen, onClose, onSuccess }: CreateStudentDialogProps) {
  const { toast } = useToast();
  const t = useTranslations('dialogs.createStudent');
  const tCommon = useTranslations('dialogs.common');
  const tRoles = useTranslations('roles');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: 'St. Regis',
    grade: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const createData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        school: formData.school || 'St. Regis',
        grade: formData.grade ? parseInt(formData.grade) : null,
        parentName: formData.parentName || null,
        parentEmail: formData.parentEmail || null,
        parentPhone: formData.parentPhone || null,
      };

      const res = await fetch(`/api/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || t('errors.createFailed'));
      }

      toast({
        title: t('success'),
        description: `${tRoles('student')} ${formData.name}`,
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        school: 'St. Regis',
        grade: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: t('errors.createFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">{t('fields.name')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('fields.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={t('placeholders.name')}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="email">{t('fields.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('placeholders.email')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('hints.email')}
                </p>
              </div>

              <div>
                <Label htmlFor="phone">{t('fields.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('placeholders.phone')}
                />
              </div>

              <div>
                <Label htmlFor="school">{t('fields.school')}</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder={t('placeholders.school')}
                />
              </div>

              <div>
                <Label htmlFor="grade">{t('fields.grade')}</Label>
                <Input
                  id="grade"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder={t('placeholders.grade')}
                />
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900">{t('fields.parentName')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">{t('fields.parentName')}</Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder={t('placeholders.parentName')}
                />
              </div>

              <div>
                <Label htmlFor="parentEmail">{t('fields.parentEmail')}</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder={t('placeholders.parentEmail')}
                />
              </div>

              <div>
                <Label htmlFor="parentPhone">{t('fields.parentPhone')}</Label>
                <Input
                  id="parentPhone"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder={t('placeholders.parentPhone')}
                />
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
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tCommon('creating') : tCommon('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}