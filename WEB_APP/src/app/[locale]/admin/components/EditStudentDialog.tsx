/**
 * EditStudentDialog Component
 * 编辑学生信息对话框
 * 权限：Admin 和 Superadmin
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import type { Student } from '@/types';

interface EditStudentDialogProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditStudentDialog({ student, isOpen, onClose, onSuccess }: EditStudentDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const t = useTranslations('dialogs.editStudent');
  const tCreate = useTranslations('dialogs.createStudent');
  const tCommon = useTranslations('dialogs.common');
  const tRoles = useTranslations('roles');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    grade: '',
    role: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
  });
  
  const isSuperAdmin = session?.user?.role === 'superadmin';

  useEffect(() => {
    if (student && isOpen) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: (student as any).phone || '',
        school: (student as any).school || '',
        grade: (student as any).grade?.toString() || '',
        role: (student as any).role || 'student',
        parentName: (student as any).parentName || '',
        parentEmail: (student as any).parentEmail || '',
        parentPhone: (student as any).parentPhone || '',
      });
    }
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        school: formData.school || 'St. Regis',
        grade: formData.grade ? parseInt(formData.grade) : null,
        parentName: formData.parentName || null,
        parentEmail: formData.parentEmail || null,
        parentPhone: formData.parentPhone || null,
      };

      if (isSuperAdmin && formData.role) {
        updateData.role = formData.role;
      }

      const res = await fetch(`/api/admin/students/${student.studentId}`, {
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
        description: formData.name,
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

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{tCreate('fields.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">{tCreate('fields.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={tCreate('placeholders.email')}
                />
              </div>

              <div>
                <Label htmlFor="phone">{tCreate('fields.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={tCreate('placeholders.phone')}
                />
              </div>

              <div>
                <Label htmlFor="school">{tCreate('fields.school')}</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder={tCreate('placeholders.school')}
                />
              </div>

              <div>
                <Label htmlFor="grade">{tCreate('fields.grade')}</Label>
                <Input
                  id="grade"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder={tCreate('placeholders.grade')}
                />
              </div>

              {isSuperAdmin && (
                <div>
                  <Label htmlFor="role">{tCreate('fields.role')}</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">{tRoles('student')}</option>
                    <option value="admin">{tRoles('admin')}</option>
                    <option value="superadmin">{tRoles('superadmin')}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">{tCreate('fields.parentName')}</Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder={tCreate('placeholders.parentName')}
                />
              </div>

              <div>
                <Label htmlFor="parentEmail">{tCreate('fields.parentEmail')}</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder={tCreate('placeholders.parentEmail')}
                />
              </div>

              <div>
                <Label htmlFor="parentPhone">{tCreate('fields.parentPhone')}</Label>
                <Input
                  id="parentPhone"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder={tCreate('placeholders.parentPhone')}
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
              {loading ? tCommon('saving') : tCommon('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}