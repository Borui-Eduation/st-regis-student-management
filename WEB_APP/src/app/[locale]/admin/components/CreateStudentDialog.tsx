/**
 * CreateStudentDialog Component
 * 创建新学生对话框
 * 权限：Admin 和 Superadmin
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
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
    role: 'student',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    passwordOption: 'default',
    customPassword: '',
  });
  
  const isSuperAdmin = session?.user?.role === 'superadmin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (formData.passwordOption === 'custom' && formData.email) {
        if (!formData.customPassword || formData.customPassword.length < 8) {
          throw new Error(t('errors.passwordTooShort'));
        }
      }

      const createData: any = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        school: formData.school || 'St. Regis',
        grade: formData.grade ? parseInt(formData.grade) : null,
        parentName: formData.parentName || null,
        parentEmail: formData.parentEmail || null,
        parentPhone: formData.parentPhone || null,
      };

      if (formData.email) {
        if (formData.passwordOption === 'custom' && formData.customPassword) {
          createData.customPassword = formData.customPassword;
        }
      }

      if (isSuperAdmin && formData.role) {
        createData.role = formData.role;
      }

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
        description: `${formData.role === 'student' ? tRoles('student') : tRoles(formData.role as any)} ${formData.name}`,
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        school: 'St. Regis',
        grade: '',
        role: 'student',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        passwordOption: 'default',
        customPassword: '',
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

              {isSuperAdmin && (
                <div className="col-span-2">
                  <Label htmlFor="role">{t('fields.role')} ({t('hints.superadmin')})</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">{tRoles('student')}</option>
                    <option value="teacher">{tRoles('teacher')}</option>
                    <option value="agent">{tRoles('agent')}</option>
                    <option value="admin">{tRoles('admin')}</option>
                    <option value="superadmin">{tRoles('superadmin')}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Password Settings */}
          {formData.email && isSuperAdmin && formData.role !== 'student' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900">
                🔐 {t('fields.passwordOption')} ({tRoles(formData.role as any)})
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="defaultPassword"
                    name="passwordOption"
                    value="default"
                    checked={formData.passwordOption === 'default'}
                    onChange={(e) => setFormData({ ...formData, passwordOption: e.target.value })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="defaultPassword" className="cursor-pointer">
                      {t('passwordOptions.default')}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('hints.password')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="customPassword"
                    name="passwordOption"
                    value="custom"
                    checked={formData.passwordOption === 'custom'}
                    onChange={(e) => setFormData({ ...formData, passwordOption: e.target.value })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="customPassword" className="cursor-pointer">
                      {t('passwordOptions.custom')}
                    </Label>
                    {formData.passwordOption === 'custom' && (
                      <div className="mt-2">
                        <Input
                          type="password"
                          value={formData.customPassword}
                          onChange={(e) => setFormData({ ...formData, customPassword: e.target.value })}
                          placeholder={t('placeholders.customPassword')}
                          minLength={8}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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