/**
 * StatsCards Component
 * 显示管理员统计数据的卡片组
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type FilterStatus = 'all' | 'pending' | 'ready' | 'open' | 'rejected';

interface Stats {
  enrollments: {
    pending: number;
    ready: number;
    open: number;
    rejected: number;
    total: number;
  };
  courses: {
    active: number;
  };
  students: {
    active: number;
  };
}

interface StatsCardsProps {
  stats: Stats | null;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

export function StatsCards({ stats, filterStatus, onFilterChange }: StatsCardsProps) {
  const t = useTranslations('pages.admin.stats');
  
  const statCards = [
    {
      id: 'all' as FilterStatus,
      icon: '👥',
      title: t('all'),
      value: stats?.students.active || 0,
      subtitle: t('allSubtitle'),
      color: 'blue',
    },
    {
      id: 'pending' as FilterStatus,
      icon: '⏳',
      title: t('pending'),
      value: stats?.enrollments.pending || 0,
      subtitle: t('pendingSubtitle'),
      color: 'orange',
    },
    {
      id: 'ready' as FilterStatus,
      icon: '✅',
      title: t('ready'),
      value: stats?.enrollments.ready || 0,
      subtitle: t('readySubtitle'),
      color: 'blue',
    },
    {
      id: 'open' as FilterStatus,
      icon: '🎉',
      title: t('open'),
      value: stats?.enrollments.open || 0,
      subtitle: t('openSubtitle'),
      color: 'green',
    },
    {
      id: 'rejected' as FilterStatus,
      icon: '❌',
      title: t('rejected'),
      value: stats?.enrollments.rejected || 0,
      subtitle: t('rejectedSubtitle'),
      color: 'red',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {statCards.map((card) => (
        <Card
          key={card.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            filterStatus === card.id ? `ring-2 ring-${card.color}-500` : ''
          }`}
          onClick={() => onFilterChange(card.id)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              {card.icon} {card.title}
            </CardTitle>
            <div className={`text-2xl font-bold text-${card.color}-600`}>
              {card.value}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-gray-500">
            📚 {t('totalCourses')}
          </CardTitle>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.courses.active || 0}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">
            {t('enrollments')}: {stats?.enrollments.total || 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}