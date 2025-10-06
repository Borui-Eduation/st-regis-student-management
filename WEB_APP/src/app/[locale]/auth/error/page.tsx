'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const t = useTranslations('pages.auth.error');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorKey: string) => {
    const key = errorKey || 'Default';
    return t(`errors.${key}`, { defaultValue: t('errors.Default') });
  };

  const errorMessage = getErrorMessage(error || 'Default');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
          {error && (
            <p className="mt-2 text-xs text-gray-400">{t('errorCode')}: {error}</p>
          )}
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  const t = useTranslations('common');
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{t('loading')}...</h1>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}

