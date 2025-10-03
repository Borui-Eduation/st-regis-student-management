/**
 * StudentTable Component
 * 学生列表表格
 */

import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Student, FilterStatus } from '../types';

interface StudentTableProps {
  students: Student[];
  filterStatus: FilterStatus;
  onStudentClick: (student: Student) => void;
}

export function StudentTable({ students, filterStatus, onStudentClick }: StudentTableProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无学生</h3>
        <p className="mt-1 text-sm text-gray-500">没有找到匹配的学生记录</p>
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
            <TableHead>当前课程</TableHead>
            <TableHead>课程状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.studentId}
              className="cursor-pointer hover:bg-blue-50"
              onClick={() => onStudentClick(student)}
            >
              <TableCell>
                <div className="font-medium text-gray-900">{student.name}</div>
                <div className="text-xs text-gray-500">ID: {student.studentId?.substring(0, 8)}...</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{student.email}</div>
              </TableCell>
              <TableCell>
                {filterStatus !== 'all' ? (
                  <div>
                    <span className="font-semibold text-purple-600">
                      {(student as any).coursesInStatus || 0}
                    </span>
                    <span className="text-gray-500 text-xs ml-1">
                      门{' '}
                      {
                        filterStatus === 'pending' ? '待审批' :
                        filterStatus === 'ready' ? '待开课' :
                        filterStatus === 'open' ? '已开课' :
                        '已拒绝'
                      }
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-blue-600">
                      {student.currentCourses || 0}
                    </span>
                    <span className="text-gray-500 text-xs ml-1">门课程</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {filterStatus !== 'all' ? (
                  <Badge
                    variant={
                      filterStatus === 'open' ? 'success' :
                      filterStatus === 'ready' ? 'default' :
                      filterStatus === 'pending' ? 'warning' :
                      'error'
                    }
                    className={filterStatus === 'ready' ? 'bg-blue-100 text-blue-800' : ''}
                  >
                    {filterStatus === 'pending' ? '⏳ 待审批' :
                     filterStatus === 'ready' ? '✅ 待开课' :
                     filterStatus === 'open' ? '🎉 已开课' :
                     '❌ 已拒绝'}
                  </Badge>
                ) : (
                  <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                    {student.status === 'active' ? '活跃' : student.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStudentClick(student);
                  }}
                >
                  查看详情
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}



