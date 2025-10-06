/**
 * Locale Layout (with i18n)
 * 语言布局（包含国际化提供者）
 */

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import NavBar from '@/components/layout/nav-bar';
import { AuthProvider } from '@/components/providers/auth-provider';

// 生成静态参数（用于静态生成）
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // 验证语言是否支持
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // 启用静态渲染
  setRequestLocale(locale);

  // 获取翻译消息
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="bg-gray-50">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <NavBar />
            <main>{children}</main>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
