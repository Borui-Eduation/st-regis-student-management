/**
 * Settings Page
 * 用户设置页面 - 修改密码等
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const t = useTranslations('pages.settings');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
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
        title: '❌ ' + tCommon('error'),
        description: t('errors.passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: '❌ ' + tCommon('error'),
        description: t('errors.passwordTooShort'),
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
        throw new Error(data.error || t('errors.changeFailed'));
      }

      toast({
        title: '✅ ' + tCommon('success'),
        description: t('passwordUpdated'),
      });

      // 清空表单
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast({
        title: '❌ ' + tCommon('failed'),
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
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-2">{t('subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* 用户信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('accountInfo.title')}</CardTitle>
            <CardDescription>{t('accountInfo.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">{t('accountInfo.name')}</Label>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {session?.user?.name || '-'}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">{t('accountInfo.email')}</Label>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {session?.user?.email || '-'}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">{t('accountInfo.role')}</Label>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {session?.user?.role && tRoles(session.user.role as string)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 修改密码卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('changePassword.title')}</CardTitle>
            <CardDescription>
              {t('changePassword.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">{t('changePassword.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                  placeholder={t('changePassword.currentPasswordPlaceholder')}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('changePassword.defaultPasswordHint')}<code className="bg-gray-100 px-2 py-0.5 rounded">StRegis2025!</code>
                </p>
              </div>

              <div>
                <Label htmlFor="newPassword">{t('changePassword.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  placeholder={t('changePassword.newPasswordPlaceholder')}
                  required
                  minLength={8}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">{t('changePassword.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder={t('changePassword.confirmPasswordPlaceholder')}
                  required
                  minLength={8}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? tCommon('saving') : t('changePassword.saveButton')}
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
                <h3 className="font-semibold text-blue-900 mb-2">{t('securityTips.title')}</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  {(t.raw('securityTips.tips') as string[]).map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
