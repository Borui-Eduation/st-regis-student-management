/**
 * CreateStudentDialog Component
 * 创建新学生对话框
 * 权限：Admin 和 Superadmin
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
  });
  
  const isSuperAdmin = session?.user?.role === 'superadmin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
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

      // SuperAdmin可以指定角色
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
        throw new Error(data.error || data.message || '创建失败');
      }

      toast({
        title: '✅ 创建成功',
        description: `学生 ${formData.name} 已创建`,
      });

      // 重置表单
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新学生</DialogTitle>
          <DialogDescription>
            添加新学生到系统中
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">基本信息</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Last Name, First Name"
                />
              </div>

              <div>
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用于登录和接收通知
                </p>
              </div>

              <div>
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="604-123-4567"
                />
              </div>

              <div>
                <Label htmlFor="school">学校</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="St. Regis"
                />
              </div>

              <div>
                <Label htmlFor="grade">年级</Label>
                <Input
                  id="grade"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="9"
                />
              </div>

              {isSuperAdmin && (
                <div className="col-span-2">
                  <Label htmlFor="role">角色 (仅SuperAdmin可见)</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">Student (学生)</option>
                    <option value="admin">Admin (管理员)</option>
                    <option value="superadmin">SuperAdmin (超级管理员)</option>
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 默认为Student，可创建Admin或SuperAdmin账号
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 家长信息 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900">家长/监护人信息</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">家长姓名</Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Parent Name"
                />
              </div>

              <div>
                <Label htmlFor="parentEmail">家长邮箱</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="parent@example.com"
                />
              </div>

              <div>
                <Label htmlFor="parentPhone">家长电话</Label>
                <Input
                  id="parentPhone"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="604-123-4567"
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
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建学生'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

