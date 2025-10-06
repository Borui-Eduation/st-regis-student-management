'use client';

import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function UnauthorizedPage() {
  const router = useRouter();
  const t = useTranslations('pages.unauthorized');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {t('message')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Please contact administrator for access, or return to home page.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {t('backToHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

