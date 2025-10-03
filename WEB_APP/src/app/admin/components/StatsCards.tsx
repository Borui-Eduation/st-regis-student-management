/**
 * StatsCards Component
 * 显示管理员统计数据的卡片组
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Stats, FilterStatus } from '../types';

interface StatsCardsProps {
  stats: Stats | null;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

export function StatsCards({ stats, filterStatus, onFilterChange }: StatsCardsProps) {
  const statCards = [
    {
      id: 'all' as FilterStatus,
      icon: '👥',
      title: '学生总数',
      value: stats?.students.active || 0,
      subtitle: '全部学生',
      color: 'blue',
    },
    {
      id: 'pending' as FilterStatus,
      icon: '⏳',
      title: '待审批',
      value: stats?.enrollments.pending || 0,
      subtitle: '需要处理',
      color: 'orange',
    },
    {
      id: 'ready' as FilterStatus,
      icon: '✅',
      title: '待开课',
      value: stats?.enrollments.ready || 0,
      subtitle: '等待IT',
      color: 'blue',
    },
    {
      id: 'open' as FilterStatus,
      icon: '🎉',
      title: '已开课',
      value: stats?.enrollments.open || 0,
      subtitle: '可以学习',
      color: 'green',
    },
    {
      id: 'rejected' as FilterStatus,
      icon: '❌',
      title: '已拒绝',
      value: stats?.enrollments.rejected || 0,
      subtitle: '被拒绝',
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
          <CardTitle className="text-xs font-medium text-gray-500">📚 总课程</CardTitle>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.courses.active || 0}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">
            注册: {stats?.enrollments.total || 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



