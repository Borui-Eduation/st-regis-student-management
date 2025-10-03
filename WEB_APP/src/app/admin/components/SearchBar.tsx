/**
 * SearchBar Component
 * 搜索和过滤工具栏
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// FilterStatus 和 SearchType 需要临时定义，因为全局types中没有
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
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const searchTypes: Array<{ value: SearchType; label: string; icon: string }> = [
    { value: 'all', label: '全部', icon: '' },
    { value: 'name', label: '姓名', icon: '👤' },
    { value: 'email', label: '邮箱', icon: '📧' },
    { value: 'course', label: '课程', icon: '📚' },
    { value: 'teacher', label: '教师', icon: '👨‍🏫' },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search Type Buttons */}
          <div className="flex gap-2">
            {searchTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => onSearchTypeChange(type.value)}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  searchType === type.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              {searchType === 'teacher' ? (
                <select
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSearchTermChange(value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">👨‍🏫 选择教师...</option>
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
                    onSearchTermChange(value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">📚 选择课程...</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={
                    searchType === 'name'
                      ? '🔍 搜索学生姓名...'
                      : searchType === 'email'
                      ? '🔍 搜索邮箱地址...'
                      : activeTab === 'students'
                      ? '🔍 搜索学生姓名、邮箱或ID...'
                      : '🔍 搜索学生姓名、邮箱或课程...'
                  }
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
            {searchType !== 'teacher' && searchType !== 'course' && (
              <Button onClick={onSearch} variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜索
              </Button>
            )}
            <Button onClick={onRefresh} variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



