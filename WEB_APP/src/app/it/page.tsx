'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReadyEnrollment {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  status: string;
  academicYear: string;
  semester: string;
}

export default function ITPage() {
  const [enrollments, setEnrollments] = useState<ReadyEnrollment[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  // 模拟数据
  const mockEnrollments: ReadyEnrollment[] = [
    {
      enrollmentId: 'demo-ready-001',
      studentName: '王五',
      studentEmail: 'wangwu@example.com',
      courseName: 'AP Physics C',
      status: 'ready',
      academicYear: '2025-2026',
      semester: 'Fall',
    },
  ];

  useEffect(() => {
    setEnrollments(mockEnrollments);
  }, []);

  const handleOpenCourse = async (enrollmentId: string) => {
    if (!confirm('确认在 Moodle 中为该学生开课吗？')) return;

    setProcessing(enrollmentId);
    try {
      const enrollment = enrollments.find(e => e.enrollmentId === enrollmentId);
      const res = await fetch('/api/it/open-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          `✅ 开课任务已创建！\n\n` +
          `系统正在 Moodle 中处理:\n` +
          `• 创建/查找学生账号\n` +
          `• 注册到课程\n` +
          `• 发送通知邮件\n\n` +
          `状态: ${data.data.status}`
        );
        setEnrollments(enrollments.filter(e => e.enrollmentId !== enrollmentId));
      } else {
        alert('❌ 操作失败: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ 操作失败: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💻 IT 开课系统</h1>
              <p className="text-sm text-gray-500 mt-1">在 Moodle 中为学生开课</p>
            </div>
            <div className="flex gap-4">
              <a href="/" className="text-blue-600 hover:text-blue-700">返回首页</a>
              <a href="/student" className="text-blue-600 hover:text-blue-700">学生端</a>
              <a href="/admin" className="text-blue-600 hover:text-blue-700">管理员</a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">待开课</CardTitle>
              <div className="text-2xl font-bold">{enrollments.filter(e => e.status === 'ready').length}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">今日已开课</CardTitle>
              <div className="text-2xl font-bold text-green-600">0</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">待处理通知</CardTitle>
              <div className="text-2xl font-bold text-blue-600">0</div>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🎓 待开课列表</CardTitle>
            <CardDescription>
              {enrollments.length === 0 ? '暂无待开课项目' : `共 ${enrollments.length} 条待开课`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>✓ 所有课程已开课完毕</p>
                <p className="text-sm mt-2">或者等待管理员审批新的注册</p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.enrollmentId}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{enrollment.studentName}</h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            待开课
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{enrollment.studentEmail}</p>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-500">课程:</span>
                            <p className="font-medium">{enrollment.courseName}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">学期:</span>
                            <p className="font-medium">{enrollment.academicYear} {enrollment.semester}</p>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-50 rounded p-3 text-sm">
                          <p className="text-gray-700 font-medium mb-1">📋 需要执行的操作:</p>
                          <ul className="text-gray-600 space-y-1">
                            <li>• 在 Moodle 中创建/查找学生账号</li>
                            <li>• 将学生添加到对应课程</li>
                            <li>• 系统自动发送开课通知邮件</li>
                          </ul>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          onClick={() => handleOpenCourse(enrollment.enrollmentId)}
                          disabled={processing === enrollment.enrollmentId}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processing === enrollment.enrollmentId ? '处理中...' : '🚀 开课'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">🔧 Moodle 集成说明</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• 点击"开课"后，系统会自动调用 Moodle API</li>
            <li>• 状态会从 <code className="bg-purple-100 px-1 rounded">ready</code> 变为 <code className="bg-purple-100 px-1 rounded">open</code></li>
            <li>• 系统会自动发送邮件给学生，包含课程访问链接</li>
            <li>• 如果 Moodle API 未配置，任务会进入队列等待处理</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚙️ 配置检查</h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${process.env.MOODLE_URL ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Moodle URL: {process.env.MOODLE_URL || '未配置'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${process.env.MOODLE_TOKEN ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Moodle Token: {process.env.MOODLE_TOKEN ? '已配置' : '未配置'}</span>
            </div>
            <p className="mt-2 text-xs">在 .env.local 中配置 MOODLE_URL 和 MOODLE_TOKEN</p>
          </div>
        </div>
      </div>
    </div>
  );
}

