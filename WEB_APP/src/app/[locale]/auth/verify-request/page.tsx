'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function VerifyRequestContent() {
  const t = useTranslations('pages.auth.verifyRequest');
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || t('yourEmail');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription className="text-base mt-2">
            {t('description')}<br />
            <strong className="text-gray-900">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📧 {t('nextSteps.title')}:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              {(t.raw('nextSteps.steps') as string[]).map((step, index) => (
                <li key={index}>{index + 1}. {step}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <strong>{t('tips.title')}:</strong>
            </p>
            <ul className="text-gray-600 space-y-1 ml-4">
              {(t.raw('tips.items') as string[]).map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm text-gray-600 text-center">
              {t('noEmail')}
            </p>
            <div className="flex gap-2">
              <Link href="/auth/signin" className="flex-1">
                <Button variant="outline" className="w-full">
                  {t('backToLogin')}
                </Button>
              </Link>
              <Link href="/auth/signin" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  {t('resend')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {t('contact')} <a href="mailto:admin@borui.org" className="text-blue-600 hover:underline">admin@borui.org</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyRequestPage() {
  const t = useTranslations('common');
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('loading')}...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyRequestContent />
    </Suspense>
  );
}



