/**
 * SearchBar Component
 * 🔍 智能搜索工具栏 - 支持全能搜索
 * 
 * 功能:
 * - 🎯 智能搜索: 自动识别搜索内容（学生/教师/课程）
 * - 📚 课程筛选: 快速筛选指定课程的学生
 * - 👨‍🏫 教师筛选: 快速筛选指定教师的学生
 * - 🔤 文本搜索: 搜索学生姓名、邮箱等信息
 */

'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

type SearchType = 'all' | 'name' | 'email' | 'course' | 'teacher';
type FilterStatus = 'all' | 'pending' | 'ready' | 'open' | 'rejected';

interface SearchBarProps {
  searchTerm: string;
  searchType: SearchType;
  filterStatus: FilterStatus;
  teachers: string[];
  courses: string[];
  activeTab: 'students' | 'enrollments';
  onSearchTermChange: (term: string) => void;
  onSearchTypeChange: (type: SearchType) => void;
  onSearch: () => void;
  onRefresh: () => void;
}

export function SearchBar({
  searchTerm,
  searchType,
  filterStatus,
  teachers,
  courses,
  activeTab,
  onSearchTermChange,
  onSearchTypeChange,
  onSearch,
  onRefresh,
}: SearchBarProps) {
  const t = useTranslations('pages.admin.search');
  const [inputValue, setInputValue] = useState(searchTerm);
  
  const showFullSearch = (activeTab === 'students' && filterStatus === 'all') || activeTab === 'enrollments';

  if (!showFullSearch) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <Button onClick={onRefresh} variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('buttons.refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const searchTypes: Array<{ value: SearchType; label: string; icon: string; description: string }> = [
    { 
      value: 'all', 
      label: t('types.all', { defaultValue: '🎯 智能搜索' }), 
      icon: '🔍',
      description: t('descriptions.all', { defaultValue: '搜索任何内容：学生、教师、课程...' })
    },
    { 
      value: 'course', 
      label: t('types.course', { defaultValue: '课程' }), 
      icon: '📚',
      description: t('descriptions.course', { defaultValue: '按课程筛选学生' })
    },
    { 
      value: 'teacher', 
      label: t('types.teacher', { defaultValue: '教师' }), 
      icon: '👨‍🏫',
      description: t('descriptions.teacher', { defaultValue: '按教师筛选学生' })
    },
  ];

  // Handle input change with real-time search
  const handleInputChange = (value: string) => {
    setInputValue(value);
    onSearchTermChange(value);
  };

  // Handle search type change
  const handleTypeChange = (type: SearchType) => {
    onSearchTypeChange(type);
    // Clear search when changing to dropdown types
    if (type === 'course' || type === 'teacher') {
      setInputValue('');
      onSearchTermChange('');
    }
  };

  // Handle clear search
  const handleClear = () => {
    setInputValue('');
    onSearchTermChange('');
  };

  return (
    <Card className="mb-6 border-2 border-gray-200 hover:border-blue-300 transition">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search Type Buttons */}
          <div className="flex flex-wrap gap-2">
            {searchTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                  searchType === type.value
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                }`}
                title={type.description}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {/* Search Help Text */}
          <div className="text-xs text-gray-500 -mt-2">
            {searchType === 'all' && (
              <span>💡 {t('hints.all', { defaultValue: '输入学生姓名、邮箱、教师名字或课程名称进行搜索' })}</span>
            )}
            {searchType === 'course' && (
              <span>📚 {t('hints.course', { defaultValue: '选择课程以查看该课程的所有学生' })}</span>
            )}
            {searchType === 'teacher' && (
              <span>👨‍🏫 {t('hints.teacher', { defaultValue: '选择教师以查看该教师名下的所有学生' })}</span>
            )}
          </div>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              {searchType === 'teacher' ? (
                <select
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange(value);
                    setTimeout(() => onSearch(), 100);
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">👨‍🏫 {t('placeholders.selectTeacher', { defaultValue: '选择教师...' })}</option>
                  {teachers.map((teacher) => (
                    <option key={teacher} value={teacher}>
                      {teacher}
                    </option>
                  ))}
                </select>
              ) : searchType === 'course' ? (
                <select
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange(value);
                    setTimeout(() => onSearch(), 100);
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">📚 {t('placeholders.selectCourse', { defaultValue: '选择课程...' })}</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSearch();
                      }
                    }}
                    placeholder={t('placeholders.searchAnything', { 
                      defaultValue: '🔍 搜索学生姓名、邮箱、教师或课程...' 
                    })}
                    className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  {inputValue && (
                    <button
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title={t('buttons.clear', { defaultValue: '清除' })}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {searchType === 'all' && (
                <Button 
                  onClick={onSearch}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t('buttons.search', { defaultValue: '搜索' })}
                </Button>
              )}
              <Button onClick={onRefresh} variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('buttons.refresh', { defaultValue: '刷新' })}
              </Button>
            </div>
          </div>

          {/* Search Statistics */}
          {searchTerm && (
            <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              🔍 {t('status.searching', { defaultValue: '正在搜索' })}: <strong>{searchTerm}</strong>
              {searchType !== 'all' && (
                <span className="ml-2">
                  ({searchType === 'course' ? '📚 ' : '👨‍🏫 '}
                  {t(`types.${searchType}`)})
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}