/**
 * EnrollmentTable Component
 * 课程注册列表表格 - 显示所有课程注册记录
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Enrollment } from '@/types';

interface EnrollmentTableProps {
  enrollments: Enrollment[];
  processing: string | null;
  onApprove: (enrollmentId: string, studentName: string) => void;
  onReject: (enrollmentId: string, studentName: string) => void;
  onRefresh?: () => void;
}

// 状态显示
const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { label: '⏳ 待审批', className: 'bg-yellow-100 text-yellow-800' },
    ready: { label: '✅ 待开课', className: 'bg-blue-100 text-blue-800' },
    open: { label: '🎉 已开课', className: 'bg-green-100 text-green-800' },
    rejected: { label: '❌ 已拒绝', className: 'bg-red-100 text-red-800' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || { 
    label: status, 
    className: 'bg-gray-100 text-gray-800' 
  };
  
  return (
    <Badge variant="default" className={config.className}>
      {config.label}
    </Badge>
  );
};

export function EnrollmentTable({ enrollments, processing, onApprove, onReject, onRefresh }: EnrollmentTableProps) {
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState<string | null>(null);
  const isSuperAdmin = session?.user?.role === 'superadmin';
  
  const handleDelete = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`⚠️ 确认删除 ${studentName} 的注册记录吗？\n\n此操作无法撤销！`)) {
      return;
    }
    
    setDeleting(enrollmentId);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        alert('✅ 删除成功！');
        onRefresh?.();
      } else {
        alert('❌ 删除失败: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ 操作失败: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };
  
  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无课程记录</h3>
        <p className="mt-1 text-sm text-gray-500">还没有学生注册课程</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生姓名</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>课程名称</TableHead>
            <TableHead>教师</TableHead>
            <TableHead>学期</TableHead>
            <TableHead>注册状态</TableHead>
            <TableHead>截止日期</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow key={enrollment.enrollmentId} className="hover:bg-gray-50">
              <TableCell>
                <div className="font-medium text-gray-900">{enrollment.studentName}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-500">{enrollment.studentEmail || '-'}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-blue-600">{enrollment.courseName}</div>
                {enrollment.courseCode && (
                  <div className="text-xs text-gray-500">{enrollment.courseCode}</div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">{enrollment.teacherName || '-'}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{enrollment.academicYear}</div>
                  <div className="text-xs text-gray-500">{enrollment.semester}</div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(enrollment.status)}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {enrollment.endDate
                  ? new Date(enrollment.endDate).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {enrollment.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onApprove(enrollment.enrollmentId, enrollment.studentName)}
                        disabled={processing === enrollment.enrollmentId}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processing === enrollment.enrollmentId ? '处理中...' : '✓ 批准'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(enrollment.enrollmentId, enrollment.studentName)}
                        disabled={processing === enrollment.enrollmentId}
                      >
                        ✕ 拒绝
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // TODO: 打开详情对话框
                        alert('查看详情功能开发中');
                      }}
                    >
                      查看详情
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(enrollment.enrollmentId, enrollment.studentName)}
                      disabled={deleting === enrollment.enrollmentId}
                    >
                      {deleting === enrollment.enrollmentId ? '删除中...' : '🗑️'}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}



