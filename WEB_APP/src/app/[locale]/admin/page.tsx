/**
 * Admin Dashboard Page
 * 管理员控制台主页面 - 模块化重构版本
 * 
 * 架构说明:
 * - 使用自定义 Hooks 管理数据和业务逻辑
 * - 使用独立组件负责 UI 渲染
 * - 主页面只负责组合和协调
 */

'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Types
import type { Student } from '@/types';

type FilterStatus = 'all' | 'pending' | 'ready' | 'open' | 'rejected';
type SearchType = 'all' | 'name' | 'email' | 'course' | 'teacher';

// Custom Hooks
import { useAdminData } from './hooks/useAdminData';
import { useEnrollmentActions } from './hooks/useEnrollmentActions';

// Components
import { StatsCards } from './components/StatsCards';
import { SearchBar } from './components/SearchBar';
import { StudentTable } from './components/StudentTable';
import { EnrollmentTable } from './components/EnrollmentTable';
import { StudentDetailDialog } from './components/StudentDetailDialog';
import { CreateStudentDialog } from './components/CreateStudentDialog';
import { Pagination } from './components/Pagination';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 20;

export default function AdminPage() {
  const t = useTranslations('pages.admin');
  const tCommon = useTranslations('common');
  
  // UI State - 默认显示注册记录（课程列表）
  const [activeTab, setActiveTab] = useState<'students' | 'enrollments'>('enrollments');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('course'); // 默认使用 course 搜索
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Data Management
  const {
    students,
    enrollments,
    stats,
    loading,
    totalPages,
    teachers,
    courses,
    refetch,
  } = useAdminData({
    activeTab,
    currentPage,
    pageSize: PAGE_SIZE,
    searchTerm,
    filterStatus,
  });

  // Enrollment Actions
  const { processing, handleApprove, handleReject } = useEnrollmentActions(refetch);

  // Search and Filter
  // Client-side filtering for enrollments (API doesn't support search yet)
  // For students tab, API handles the search
  const filteredStudents = students;
  
  const filteredEnrollments = useMemo(() => {
    // 🚀 使用统一的系统用户邮箱列表进行过滤
    const { getAllSystemUserEmails } = require('@/lib/permissions');
    const systemEmails = getAllSystemUserEmails();
    
    // 先过滤掉系统用户的注册记录
    let filtered = enrollments.filter(enrollment => {
      const email = enrollment.studentEmail?.toLowerCase();
      return email && !systemEmails.has(email);
    });
    
    // 🔥 应用状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.status === filterStatus);
    }
    
    // 再应用搜索过滤
    if (searchTerm.trim() && activeTab === 'enrollments') {
      const term = searchTerm.toLowerCase().trim();
      
      filtered = filtered.filter(enrollment => {
        // 根据搜索类型过滤
        switch (searchType) {
          case 'course':
            return enrollment.courseName?.toLowerCase().includes(term);
          case 'teacher':
            return enrollment.teacherName?.toLowerCase().includes(term);
          case 'all':
          default:
            // 搜索所有字段（姓名、邮箱、课程、教师）
            return (
              enrollment.studentName?.toLowerCase().includes(term) ||
              enrollment.studentEmail?.toLowerCase().includes(term) ||
              enrollment.courseName?.toLowerCase().includes(term) ||
              enrollment.teacherName?.toLowerCase().includes(term)
            );
        }
      });
    }
    
    return filtered;
  }, [enrollments, searchTerm, searchType, activeTab, filterStatus]);

  // Event Handlers
  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
    // 重置搜索，以便显示该状态的所有记录
    setSearchTerm('');
  };

  const handleSearch = () => {
    // 在学生标签页，通过API搜索（需要重新获取数据）
    if (activeTab === 'students') {
      setCurrentPage(1);
      refetch();
    }
    // 在课程注册记录标签页，使用客户端过滤（无需重新获取）
    // filteredEnrollments 会自动根据 searchTerm 更新
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const getPageTitle = () => {
    if (activeTab === 'enrollments') {
      if (filterStatus === 'all') return t('filters.allEnrollments');
      return t(`filters.${filterStatus}Courses`);
    }
    if (filterStatus === 'all') return t('filters.allStudents');
    return t(`filters.${filterStatus}Students`);
  };

  const getPageDescription = () => {
    if (loading) return tCommon('loading');
    if (activeTab === 'enrollments') {
      const count = filteredEnrollments.length;
      const total = enrollments.length;
      if (searchTerm.trim() && count !== total) {
        return tCommon('total', { count: `${count} / ${total}` });
      }
      return tCommon('total', { count: total });
    }
    if (filterStatus === 'all') {
      return tCommon('page', { current: currentPage, total: totalPages });
    }
    return tCommon('total', { count: filteredStudents.length });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          stats={stats}
          filterStatus={filterStatus}
          onFilterChange={handleFilterChange}
        />

        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          searchType={searchType}
          filterStatus={filterStatus}
          teachers={teachers}
          courses={courses}
          activeTab={activeTab}
          onSearchTermChange={setSearchTerm}
          onSearchTypeChange={setSearchType}
          onSearch={handleSearch}
          onRefresh={refetch}
        />

        {/* Tab切换 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrollments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('tabs.enrollments')}
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('tabs.students')}
            </button>
          </nav>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{getPageTitle()}</CardTitle>
                <CardDescription>{getPageDescription()}</CardDescription>
              </div>
              {activeTab === 'students' && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t('actions.createStudent')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{tCommon('loading')}</p>
              </div>
            ) : activeTab === 'enrollments' ? (
              <EnrollmentTable
                enrollments={filteredEnrollments}
                processing={processing}
                onApprove={handleApprove}
                onReject={handleReject}
                onRefresh={refetch}
              />
            ) : (
              <>
                <StudentTable
                  students={filteredStudents}
                  filterStatus={filterStatus}
                  onStudentClick={handleStudentClick}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={PAGE_SIZE}
                  totalItems={stats?.students.active || 0}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Student Detail Dialog */}
        <StudentDetailDialog
          student={selectedStudent}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onRefresh={refetch}
        />

        {/* Create Student Dialog */}
        <CreateStudentDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={refetch}
        />

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {activeTab === 'students' 
                  ? t('info.studentManagement.title') 
                  : t('info.enrollmentManagement.title')}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                {activeTab === 'students' ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {(t.raw('info.studentManagement.items') as string[]).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {(t.raw('info.enrollmentManagement.items') as string[]).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
