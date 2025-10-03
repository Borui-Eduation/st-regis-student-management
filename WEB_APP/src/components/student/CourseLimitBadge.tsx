'use client';

import { useEffect, useState } from 'react';

interface CourseLimitInfo {
  canEnroll: boolean;
  currentCourses: number;
  maxCourses: number;
  remainingSlots: number;
  message: string;
}

export function CourseLimitBadge() {
  const [limitInfo, setLimitInfo] = useState<CourseLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimit();
  }, []);

  const fetchLimit = async () => {
    try {
      const response = await fetch('/api/student/check-limit');
      const result = await response.json();
      
      if (result.success) {
        setLimitInfo(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch course limit:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !limitInfo) {
    return null;
  }

  const percentage = (limitInfo.currentCourses / limitInfo.maxCourses) * 100;
  
  // 根据剩余课程数选择颜色
  const getColorClasses = () => {
    if (limitInfo.remainingSlots === 0) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
        bar: 'bg-red-500',
      };
    } else if (limitInfo.remainingSlots === 1) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700',
        bar: 'bg-orange-500',
      };
    } else if (limitInfo.remainingSlots <= 2) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-700',
        bar: 'bg-yellow-500',
      };
    } else {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700',
        bar: 'bg-blue-500',
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <div>
            <div className={`text-sm font-medium ${colors.text}`}>
              本学期选课进度
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {limitInfo.message}
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full ${colors.badge} font-semibold text-sm`}>
          {limitInfo.currentCourses} / {limitInfo.maxCourses}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${colors.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 警告提示 */}
      {!limitInfo.canEnroll && (
        <div className="mt-3 p-2 bg-white rounded border border-red-300">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>已达到本学期选课上限，无法继续选课</span>
          </div>
        </div>
      )}

      {/* 剩余提示 */}
      {limitInfo.canEnroll && limitInfo.remainingSlots <= 2 && (
        <div className="mt-3 p-2 bg-white rounded border border-orange-300">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              仅剩 {limitInfo.remainingSlots} 个选课名额，请谨慎选择
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseLimitBadge;



