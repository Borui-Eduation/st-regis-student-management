'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. 先检查用户是否存在
      console.log('🔍 检查用户是否存在:', email);
      
      const checkResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const checkData = await checkResponse.json();
      
      if (!checkData.exists) {
        // 用户不存在
        setLoading(false);
        setError(
          '此邮箱未注册。\n\n' +
          '本系统仅对会员开放，不提供公开注册。\n\n' +
          '如需注册账户，请联系管理员：admin@borui.org'
        );
        return;
      }

      // 2. 用户存在，发送登录邮件
      console.log('✅ 用户存在，发送登录邮件到:', email);
      
      const result = await signIn('resend', { 
        email: email.toLowerCase(), 
        callbackUrl,
        redirect: false  // 不自动跳转，手动处理
      });
      
      console.log('📧 发送结果:', result);
      
      if (result?.error) {
        setLoading(false);
        setError('发送邮件时出现问题：' + result.error);
      } else {
        // 发送成功，手动跳转到验证页面
        window.location.href = `/auth/verify-request?email=${encodeURIComponent(email)}`;
      }
      
    } catch (error) {
      console.error('💥 登录错误:', error);
      setLoading(false);
      setError('登录失败，请重试');
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            St Regis 选课系统
          </CardTitle>
          <CardDescription className="text-base mt-2">
            选择登录方式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google 登录 */}
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            使用 Google 账号登录
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">或</span>
            </div>
          </div>

          {/* Email 登录 */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(''); // 清除错误提示
                }}
                required
                className="h-12"
              />
              
              {/* 错误提示 */}
              {error && (
                <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-2">无法登录</p>
                      <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  检查中...
                </span>
              ) : '发送登录链接'}
            </Button>
          </form>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              登录即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">加载中...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
