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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Types
import type { Student, FilterStatus, SearchType } from './types';

// Custom Hooks
import { useAdminData } from './hooks/useAdminData';
import { useEnrollmentActions } from './hooks/useEnrollmentActions';

// Components
import { StatsCards } from './components/StatsCards';
import { SearchBar } from './components/SearchBar';
import { StudentTable } from './components/StudentTable';
import { EnrollmentTable } from './components/EnrollmentTable';
import { StudentDetailDialog } from './components/StudentDetailDialog';
import { Pagination } from './components/Pagination';

const PAGE_SIZE = 20;

export default function AdminPage() {
  // UI State
  const [activeTab, setActiveTab] = useState<'students' | 'enrollments'>('students');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;

    const search = searchTerm.toLowerCase();
    return students.filter((s) => {
      const enrollmentsList = (s as any).enrollmentsInStatus || (s as any).enrollments || [];

      switch (searchType) {
        case 'name':
          return s.name?.toLowerCase().includes(search);
        case 'email':
          return s.email?.toLowerCase().includes(search);
        case 'course':
          return enrollmentsList.some((e: any) => e.courseName?.toLowerCase().includes(search));
        case 'teacher':
          return enrollmentsList.some((e: any) => e.teacherName?.toLowerCase().includes(search));
        case 'all':
        default:
          return (
            s.name?.toLowerCase().includes(search) ||
            s.email?.toLowerCase().includes(search) ||
            s.studentId?.toLowerCase().includes(search) ||
            enrollmentsList.some(
              (e: any) =>
                e.courseName?.toLowerCase().includes(search) ||
                e.teacherName?.toLowerCase().includes(search)
            )
          );
      }
    });
  }, [students, searchTerm, searchType]);

  // Event Handlers
  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const getPageTitle = () => {
    if (activeTab === 'enrollments') return '待审批列表';
    if (filterStatus === 'all') return '学生列表';
    const statusMap = {
      pending: '待审批课程学生',
      ready: '待开课课程学生',
      open: '已开课课程学生',
      rejected: '已拒绝课程学生',
    };
    return statusMap[filterStatus] || '学生列表';
  };

  const getPageDescription = () => {
    if (loading) return '加载中...';
    if (activeTab === 'enrollments') {
      return `共 ${enrollments.length} 条记录`;
    }
    if (filterStatus === 'all') {
      return `共 ${filteredStudents.length} 条记录 (第 ${currentPage} 页 / 共 ${totalPages} 页)`;
    }
    return `共 ${filteredStudents.length} 个学生`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理员控制台</h1>
          <p className="mt-2 text-sm text-gray-600">管理学生、审批注册申请</p>
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

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>{getPageTitle()}</CardTitle>
            <CardDescription>{getPageDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">加载中...</p>
              </div>
            ) : activeTab === 'students' ? (
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
            ) : (
              <EnrollmentTable
                enrollments={enrollments}
                processing={processing}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </CardContent>
        </Card>

        {/* Student Detail Dialog */}
        <StudentDetailDialog
          student={selectedStudent}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
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
                {activeTab === 'students' ? '学生管理说明' : '操作说明'}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                {activeTab === 'students' ? (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>查看所有注册学生的详细信息</li>
                    <li>使用搜索框快速定位学生</li>
                    <li>支持按姓名、邮箱、课程、教师搜索</li>
                    <li>分页显示，每页 {PAGE_SIZE} 条记录</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      批准后，注册状态变为 <code className="bg-blue-100 px-1 rounded">ready</code>
                      ，系统自动发送 IT 通知邮件
                    </li>
                    <li>
                      拒绝后，注册状态变为 <code className="bg-blue-100 px-1 rounded">rejected</code>
                      ，系统自动通知学生
                    </li>
                    <li>IT 人员会在 Moodle 中为批准的注册开课</li>
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
