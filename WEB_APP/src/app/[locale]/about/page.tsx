/**
 * Home Page (Internationalized)
 * 首页（国际化版本）
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/config';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  
  // 启用静态渲染
  setRequestLocale(locale);
  
  const t = await getTranslations('pages.home');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎓 {t('title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('subtitle')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('features.highConcurrency.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('features.highConcurrency.description')}
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('features.automation.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('features.automation.description')}
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('features.realTime.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('features.realTime.description')}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('apiEndpoints')}
            </h2>
            <div className="text-left space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono text-xs">GET</span>
                <code className="text-gray-700">/api/courses</code>
                <span className="text-gray-500">- Get course list</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-xs">POST</span>
                <code className="text-gray-700">/api/enroll/submit</code>
                <span className="text-gray-500">- Submit enrollment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-xs">POST</span>
                <code className="text-gray-700">/api/admin/approve</code>
                <span className="text-gray-500">- Admin approval</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-xs">POST</span>
                <code className="text-gray-700">/api/admin/enrollments</code>
                <span className="text-gray-500">- Admin add enrollment</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center">
            <Link 
              href="/student" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-semibold"
            >
              {t('buttons.studentEnroll')}
            </Link>
            <Link 
              href="/admin" 
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-semibold"
            >
              {t('buttons.adminApprove')}
            </Link>
            <Link 
              href="/admin" 
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-semibold"
            >
              {t('buttons.dataStats')}
            </Link>
          </div>
          
          <div className="mt-4 text-center">
            <a 
              href="/api/courses" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              {t('testApi')}
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {t('systemStatus')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
