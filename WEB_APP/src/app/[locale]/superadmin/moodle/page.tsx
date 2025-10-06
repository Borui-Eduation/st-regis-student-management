/**
 * Superadmin Moodle Management Page
 * 超级管理员 Moodle 查看页面
 * 
 * 功能：
 * - 查看 Moodle 中所有已注册用户
 * - 查看每个用户对应的课程
 * - 搜索和过滤用户
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoodleConnectionTest } from './test-connection';

interface MoodleStudent {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  suspended?: boolean;
  lastaccess?: number;
  firstaccess?: number;
  groups?: any[];
  roles?: any[];
}

interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  visible: boolean;
  categoryid?: number;
  students: MoodleStudent[];
  studentCount: number;
  totalEnrollments: number;
}

interface MoodleData {
  courses: MoodleCourse[];
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
}

export default function SuperadminMoodlePage() {
  const t = useTranslations('pages.moodle');
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<MoodleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // 权限检查
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'superadmin') {
      router.push('/unauthorized');
    }
  }, [session, status, router]);

  // 获取 Moodle 数据
  const fetchMoodleData = async (noCache: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = noCache 
        ? '/api/superadmin/moodle/users?nocache=1'
        : '/api/superadmin/moodle/users';
      
      console.log('🔍 开始获取数据:', url);
      const res = await fetch(url);
      const result = await res.json();
      
      console.log('📊 API 响应:', result);
      
      if (result.success) {
        setData(result.data);
        setError(null);
        
        // 显示成功提示（包括耗时）
        if (result.message && debugMode) {
          console.log('✅ ' + result.message);
        }
      } else {
        const errorMsg = result.error || t('errors.unknown');
        setError(errorMsg);
        console.error('❌ API Error:', errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Request failed:', error);
      setError(t('errors.requestFailed', { error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'superadmin') {
      fetchMoodleData();
    }
  }, [session]);

  // 切换课程展开状态
  const toggleCourseExpanded = (courseId: number) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  // 过滤课程
  const filteredCourses = data?.courses.filter(course => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      course.fullname.toLowerCase().includes(term) ||
      course.shortname.toLowerCase().includes(term) ||
      course.students.some(student => 
        student.fullname.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.username.toLowerCase().includes(term)
      )
    );
  }) || [];

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{tCommon('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📚 Moodle 用户管理</h1>
              <p className="mt-2 text-sm text-gray-600">查看 Moodle 中所有已注册用户及其课程</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="rounded"
                />
                调试模式
              </label>
              <button
                onClick={() => fetchMoodleData(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? '刷新中...' : '🔄 刷新数据'}
              </button>
              <button
                onClick={() => fetchMoodleData(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                disabled={loading}
                title="跳过缓存，直接从 Moodle 获取数据"
              >
                {loading ? '刷新中...' : '🔥 强制刷新'}
              </button>
            </div>
          </div>
        </div>

        {/* Debug Mode: Connection Test */}
        {debugMode && <MoodleConnectionTest />}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">加载失败</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('Moodle') && (
                    <div className="mt-2">
                      <p className="font-medium">可能的原因：</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Moodle 环境变量未配置（MOODLE_URL, MOODLE_TOKEN）</li>
                        <li>Moodle Web Services 未启用</li>
                        <li>Token 权限不足</li>
                        <li>网络连接问题</li>
                      </ul>
                      <p className="mt-2 font-medium">💡 提示：勾选上方的"调试模式"可以测试 Moodle 连接</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">总课程数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {data.totalCourses}
                </div>
                <p className="text-xs text-gray-500 mt-1">开设的课程</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">总学生数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {data.totalStudents}
                </div>
                <p className="text-xs text-gray-500 mt-1">唯一学生数</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">总注册数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {data.totalEnrollments}
                </div>
                <p className="text-xs text-gray-500 mt-1">课程注册总数</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🔍</span>
              <Input
                type="text"
                placeholder="搜索课程名称、代码或学生姓名、邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  清除
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                找到 {filteredCourses.length} 个匹配的课程
              </p>
            )}
          </CardContent>
        </Card>

        {/* Course List */}
        <Card>
          <CardHeader>
            <CardTitle>课程列表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">加载中...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {searchTerm ? '未找到匹配的课程' : '暂无课程数据'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => {
                  const isExpanded = expandedCourses.has(course.id);
                  
                  return (
                    <div
                      key={course.id}
                      className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {/* Course Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleCourseExpanded(course.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Course Icon */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                              📚
                            </div>
                            
                            {/* Course Info */}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {course.fullname}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-600 font-mono">
                                  {course.shortname}
                                </span>
                                {course.visible ? (
                                  <Badge variant="success" className="text-xs">
                                    可见
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs">
                                    隐藏
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Student Count */}
                            <div className="text-right">
                              <Badge variant="info" className="text-sm">
                                👥 {t('courseList.studentCount', { count: course.studentCount })}
                              </Badge>
                              {course.totalEnrollments > course.studentCount && (
                                <p className="text-xs text-gray-500 mt-1">
                                  （共 {course.totalEnrollments} 人注册）
                                </p>
                              )}
                            </div>

                            {/* Expand Icon */}
                            <div className="text-gray-400">
                              {isExpanded ? '▼' : '▶'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Students List (Expandable) */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">
                              {t('courseList.enrolledStudents', { count: course.studentCount })}
                            </h4>
                            {/* Status Legend */}
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-blue-100"></div>
                                <span className="text-gray-600">活跃</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-yellow-100"></div>
                                <span className="text-gray-600">不活跃</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-100"></div>
                                <span className="text-gray-600">已停用</span>
                              </div>
                            </div>
                          </div>
                          
                          {course.students.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">{t('courseList.noStudents')}</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {course.students.map((student) => {
                                // 计算状态
                                const isSuspended = student.suspended;
                                const hasLastAccess = student.lastaccess && student.lastaccess > 0;
                                const lastAccessDate = hasLastAccess ? new Date(student.lastaccess * 1000) : null;
                                const firstAccessDate = student.firstaccess && student.firstaccess > 0 ? new Date(student.firstaccess * 1000) : null;
                                
                                // 判断是否长时间未访问（超过30天）
                                const isInactive = hasLastAccess && lastAccessDate 
                                  ? (Date.now() - lastAccessDate.getTime()) > 30 * 24 * 60 * 60 * 1000 
                                  : false;
                                
                                return (
                                  <div
                                    key={student.id}
                                    className={`bg-white border rounded-md p-3 hover:border-blue-300 transition-colors ${
                                      isSuspended ? 'border-red-300 bg-red-50' : 
                                      isInactive ? 'border-yellow-300 bg-yellow-50' : 
                                      'border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* Student Avatar */}
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                                        isSuspended ? 'bg-red-100 text-red-600' :
                                        isInactive ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-blue-100 text-blue-600'
                                      }`}>
                                        {student.firstname.charAt(0)}{student.lastname.charAt(0)}
                                      </div>
                                      
                                      {/* Student Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <h5 className="font-medium text-gray-900 text-sm truncate">
                                            {student.fullname}
                                          </h5>
                                          {/* Status Badge */}
                                          {isSuspended && (
                                            <Badge variant="error" className="text-xs flex-shrink-0">
                                              已停用
                                            </Badge>
                                          )}
                                          {!isSuspended && isInactive && (
                                            <Badge variant="warning" className="text-xs flex-shrink-0">
                                              不活跃
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        <p className="text-xs text-gray-500 truncate mt-1">
                                          📧 {student.email}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate mt-1">
                                          👤 {student.username}
                                        </p>
                                        
                                        {/* Last Access Info */}
                                        {hasLastAccess && lastAccessDate && (
                                          <p className="text-xs text-gray-400 mt-2">
                                            🕐 最后访问: {lastAccessDate.toLocaleDateString('zh-CN')}
                                          </p>
                                        )}
                                        {!hasLastAccess && firstAccessDate && (
                                          <p className="text-xs text-gray-400 mt-2">
                                            ⚠️ 从未访问
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

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
              <h3 className="text-sm font-medium text-blue-800">关于 Moodle 集成</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>此页面显示 Moodle 中所有开设的课程及其注册学生</li>
                  <li>数据通过 Moodle Enrolment API 实时获取</li>
                  <li>点击课程可展开查看该课程的所有学生</li>
                  <li>支持按课程名称、代码或学生信息搜索</li>
                  <li>自动过滤系统管理员和教师账号，只显示学生</li>
                  <li><strong>🎨 学生状态标识：</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li><span className="text-red-700">红色 = 已停用</span>（账号被暂停）</li>
                      <li><span className="text-yellow-700">黄色 = 不活跃</span>（超过30天未访问）</li>
                      <li><span className="text-blue-700">蓝色 = 活跃</span>（正常状态）</li>
                    </ul>
                  </li>
                  <li>显示学生的最后访问时间，便于监控学习活跃度</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

