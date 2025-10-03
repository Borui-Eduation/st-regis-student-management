/**
 * Agent Dashboard Page
 * 中介工作台 - 查看和管理自己推荐的学生
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Student, Enrollment } from '@/types';

export default function AgentDashboardPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'enrollments'>('students');

  // 加载中介的学生
  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agent/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('加载学生列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载中介学生的注册记录
  const fetchMyEnrollments = async () => {
    try {
      const response = await fetch('/api/agent/enrollments');
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      const data = await response.json();
      setEnrollments(data.data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  useEffect(() => {
    fetchMyStudents();
    fetchMyEnrollments();
  }, []);

  // 过滤学生
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm)
  );

  // 统计数据
  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    totalRevenue: students.reduce((sum, s) => sum + (s.totalPaid || 0), 0),
    totalOwed: students.reduce((sum, s) => sum + (s.totalOwed || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">中介工作台</h1>
          <p className="mt-2 text-sm text-gray-600">
            欢迎，{session?.user?.name || session?.user?.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
              <div className="text-sm text-gray-600">推荐学生总数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.activeStudents}</div>
              <div className="text-sm text-gray-600">活跃学生</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">总收入</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                ${stats.totalOwed.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">总欠费</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              我的学生
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrollments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              注册记录
            </button>
          </nav>
        </div>

        {/* Search Bar */}
        {activeTab === 'students' && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="搜索学生姓名、邮箱或电话..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={fetchMyStudents}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  🔄 刷新
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Table */}
        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle>我的学生</CardTitle>
              <CardDescription>
                共 {filteredStudents.length} 个学生
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">加载中...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无学生</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学生信息
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学校/年级
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          联系方式
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          财务状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student) => (
                        <tr key={student.studentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email || '无邮箱'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{student.school}</div>
                            {student.grade && (
                              <div className="text-xs text-gray-400">{student.grade} 年级</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.phone || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="text-green-600">
                              已付: ${student.totalPaid?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-orange-600">
                              欠费: ${student.totalOwed?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={student.status === 'active' ? 'default' : 'secondary'}
                              className={
                                student.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {student.status === 'active' ? '活跃' : '停用'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enrollments Table */}
        {activeTab === 'enrollments' && (
          <Card>
            <CardHeader>
              <CardTitle>注册记录</CardTitle>
              <CardDescription>
                共 {enrollments.length} 条记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无注册记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学生
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          课程
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          教师
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          支付状态
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.enrollmentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.studentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.courseName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {enrollment.teacherName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                enrollment.status === 'open'
                                  ? 'default'
                                  : enrollment.status === 'ready'
                                  ? 'secondary'
                                  : enrollment.status === 'rejected'
                                  ? 'destructive'
                                  : 'outline'
                              }
                            >
                              {enrollment.status === 'pending' && '待审批'}
                              {enrollment.status === 'ready' && '待开课'}
                              {enrollment.status === 'open' && '已开课'}
                              {enrollment.status === 'rejected' && '已拒绝'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={enrollment.payment.paid ? 'default' : 'destructive'}
                              className={
                                enrollment.payment.paid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {enrollment.payment.paid ? '已支付' : '未支付'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              <h3 className="text-sm font-medium text-blue-800">中介功能说明</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>您可以查看所有您推荐的学生信息</li>
                  <li>查看学生的注册记录和支付状态</li>
                  <li>如需为学生注册课程，请联系管理员</li>
                  <li>财务结算将根据您的佣金比例计算</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

