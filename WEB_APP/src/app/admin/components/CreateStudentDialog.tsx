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
    passwordOption: 'default', // 'default' 或 'custom'
    customPassword: '',
  });
  
  const isSuperAdmin = session?.user?.role === 'superadmin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      // 验证自定义密码
      if (formData.passwordOption === 'custom' && formData.email) {
        if (!formData.customPassword || formData.customPassword.length < 8) {
          throw new Error('自定义密码至少需要8个字符');
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

      // 添加密码设置
      if (formData.email) {
        if (formData.passwordOption === 'custom' && formData.customPassword) {
          createData.customPassword = formData.customPassword;
        }
        // 否则使用默认密码（API会自动设置）
      }

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

      let successMessage = `${formData.role === 'student' ? '学生' : '用户'} ${formData.name} 已创建`;
      
      if (formData.email && formData.role !== 'student') {
        const passwordInfo = formData.passwordOption === 'custom' 
          ? '已设置自定义密码' 
          : '默认密码: StRegis2025!';
        successMessage += `。${passwordInfo}`;
      }

      toast({
        title: '✅ 创建成功',
        description: successMessage,
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
        passwordOption: 'default',
        customPassword: '',
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

              <div className="col-span-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用于接收通知。{isSuperAdmin && formData.role !== 'student' && '管理员/中介账号可用于登录。'}
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
                    <option value="teacher">Teacher (教师)</option>
                    <option value="agent">Agent (中介)</option>
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

          {/* 密码设置 - 仅对 admin/superadmin/agent 角色 */}
          {formData.email && isSuperAdmin && formData.role !== 'student' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900">🔐 登录密码设置（{formData.role === 'admin' ? '管理员' : formData.role === 'superadmin' ? '超级管理员' : '中介'}账号）</h3>
              
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
                      使用默认密码（推荐）
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      默认密码为：<code className="bg-gray-100 px-2 py-0.5 rounded font-mono">StRegis2025!</code>
                      <br />
                      用户可以在登录后自行修改密码
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
                      设置自定义密码
                    </Label>
                    {formData.passwordOption === 'custom' && (
                      <div className="mt-2">
                        <Input
                          type="password"
                          value={formData.customPassword}
                          onChange={(e) => setFormData({ ...formData, customPassword: e.target.value })}
                          placeholder="输入自定义密码（至少8个字符）"
                          minLength={8}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          密码至少需要8个字符，建议包含大小写字母、数字和特殊字符
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">登录方式</p>
                    <p>管理员/中介可以使用以下方式登录：</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>邮箱 + 密码</li>
                      <li>Google账号（如果邮箱是Gmail）</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 学生账号说明 */}
          {formData.email && formData.role === 'student' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-gray-700">
                  <p className="font-semibold">学生账号</p>
                  <p className="mt-1">学生账号仅用于记录和管理，不提供登录功能。</p>
                </div>
              </div>
            </div>
          )}

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

