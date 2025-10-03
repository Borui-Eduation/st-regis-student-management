/**
 * EnrollmentTable Component
 * 待审批注册列表表格
 */

import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Enrollment } from '../types';

interface EnrollmentTableProps {
  enrollments: Enrollment[];
  processing: string | null;
  onApprove: (enrollmentId: string, studentName: string) => void;
  onReject: (enrollmentId: string, studentName: string) => void;
}

export function EnrollmentTable({ enrollments, processing, onApprove, onReject }: EnrollmentTableProps) {
  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无待审批项目</h3>
        <p className="mt-1 text-sm text-gray-500">所有注册已处理完毕或等待学生提交</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生信息</TableHead>
            <TableHead>课程</TableHead>
            <TableHead>学期</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>提交时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow key={enrollment.enrollmentId}>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{enrollment.studentName}</div>
                  <div className="text-sm text-gray-500">{enrollment.studentEmail}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{enrollment.courseName}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {enrollment.academicYear}
                  <br />
                  {enrollment.semester}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-green-600 font-semibold">
                  ${enrollment.payment?.amount || 1200}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="warning">待审批</Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {enrollment.createdAt
                  ? new Date(enrollment.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(enrollment.enrollmentId, enrollment.studentName)}
                    disabled={processing === enrollment.enrollmentId}
                    className="bg-green-600 hover:bg-green-700"
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}



