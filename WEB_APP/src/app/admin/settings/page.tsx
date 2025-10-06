/**
 * Settings Page
 * 用户设置页面 - 修改密码等
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证密码
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: '❌ 错误',
        description: '两次输入的新密码不一致',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: '❌ 错误',
        description: '密码至少需要8个字符',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '修改密码失败');
      }

      toast({
        title: '✅ 成功',
        description: '密码已更新',
      });

      // 清空表单
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast({
        title: '❌ 失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">账户设置</h1>
        <p className="text-gray-600 mt-2">管理您的账户信息和安全设置</p>
      </div>

      <div className="space-y-6">
        {/* 用户信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
            <CardDescription>您当前登录的账户信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">姓名</Label>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {session?.user?.name || '-'}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">邮箱</Label>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {session?.user?.email || '-'}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">角色</Label>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {session?.user?.role === 'superadmin' && '超级管理员'}
                {session?.user?.role === 'admin' && '管理员'}
                {session?.user?.role === 'teacher' && '教师'}
                {session?.user?.role === 'agent' && '中介'}
                {session?.user?.role === 'student' && '学生'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 修改密码卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
            <CardDescription>
              更新您的登录密码。密码至少需要8个字符。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">当前密码</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                  placeholder="输入当前密码"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  如果您是首次设置密码，默认密码为：<code className="bg-gray-100 px-2 py-0.5 rounded">StRegis2025!</code>
                </p>
              </div>

              <div>
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  placeholder="输入新密码（至少8个字符）"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="再次输入新密码"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? '保存中...' : '💾 保存密码'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 安全提示 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">安全提示</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>建议使用包含大小写字母、数字和特殊字符的强密码</li>
                  <li>不要与他人分享您的密码</li>
                  <li>定期更换密码以保护账户安全</li>
                  <li>您也可以使用Google账号登录，无需记忆密码</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
