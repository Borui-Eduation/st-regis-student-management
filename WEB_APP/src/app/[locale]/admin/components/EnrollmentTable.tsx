/**
 * EnrollmentTable Component
 * 课程注册列表表格 - 显示所有课程注册记录
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EditGradesDialog } from './EditGradesDialog';
import { ChangeStatusDialog } from './ChangeStatusDialog';
import type { Enrollment } from '@/types';

interface EnrollmentTableProps {
  enrollments: Enrollment[];
  processing: string | null;
  onApprove: (enrollmentId: string, studentName: string) => void;
  onReject: (enrollmentId: string, studentName: string) => void;
  onRefresh?: () => void;
}

export function EnrollmentTable({ enrollments, processing, onApprove, onReject, onRefresh }: EnrollmentTableProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations('components.enrollmentTable');
  const tStatus = useTranslations('status');
  
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isEditGradesOpen, setIsEditGradesOpen] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const isSuperAdmin = session?.user?.role === 'superadmin';
  
  // 状态显示
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { className: 'bg-yellow-100 text-yellow-800' },
      ready: { className: 'bg-blue-100 text-blue-800' },
      open: { className: 'bg-green-100 text-green-800' },
      rejected: { className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      className: 'bg-gray-100 text-gray-800' 
    };
    
    return (
      <Badge variant="default" className={config.className}>
        {tStatus(status)}
      </Badge>
    );
  };
  
  const handleEditGrades = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsEditGradesOpen(true);
  };
  
  const handleChangeStatus = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsChangeStatusOpen(true);
  };
  
  const handleGradesEditSuccess = () => {
    onRefresh?.();
  };
  
  const handleStatusChangeSuccess = () => {
    onRefresh?.();
  };
  
  const handleDelete = async (enrollmentId: string, studentName: string) => {
    if (!confirm(t('confirmDelete', { name: studentName }))) {
      return;
    }
    
    setDeleting(enrollmentId);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        alert(t('deleteSuccess'));
        onRefresh?.();
      } else {
        alert(t('deleteFailed', { error: data.error }));
      }
    } catch (error: any) {
      alert(t('operationFailed', { error: error.message }));
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty.title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('empty.description')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('headers.studentName')}</TableHead>
              <TableHead>{t('headers.email')}</TableHead>
              <TableHead>{t('headers.courseName')}</TableHead>
              <TableHead>{t('headers.teacher')}</TableHead>
              <TableHead>{t('headers.semester')}</TableHead>
              <TableHead>{t('headers.status')}</TableHead>
              <TableHead>{t('headers.grades')}</TableHead>
              <TableHead>{t('headers.endDate')}</TableHead>
              <TableHead className="text-right">{t('headers.actions')}</TableHead>
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
              <TableCell>
                <div className="text-xs space-y-1">
                  {enrollment.midtermMark !== undefined && enrollment.midtermMark !== null ? (
                    <div className="text-blue-600 font-medium">
                      {t('grades.midterm')}: {enrollment.midtermMark}
                    </div>
                  ) : (
                    <div className="text-gray-400">{t('grades.midterm')}: -</div>
                  )}
                  {enrollment.finalGrade !== undefined && enrollment.finalGrade !== null ? (
                    <div className="text-green-600 font-medium">
                      {t('grades.final')}: {enrollment.finalGrade}
                    </div>
                  ) : (
                    <div className="text-gray-400">{t('grades.final')}: -</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {enrollment.endDate
                  ? new Date(enrollment.endDate).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2 flex-wrap">
                  {enrollment.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onApprove(enrollment.enrollmentId, enrollment.studentName)}
                        disabled={processing === enrollment.enrollmentId}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processing === enrollment.enrollmentId ? t('actions.processing') : '✓ ' + t('actions.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(enrollment.enrollmentId, enrollment.studentName)}
                        disabled={processing === enrollment.enrollmentId}
                      >
                        ✕ {t('actions.reject')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          router.push(`/teacher/performance/${enrollment.enrollmentId}`);
                        }}
                      >
                        {t('actions.viewDetails')}
                      </Button>
                      {enrollment.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                          onClick={() => handleEditGrades(enrollment)}
                        >
                          📝 {t('actions.editGrades')}
                        </Button>
                      )}
                    </>
                  )}
                  {isSuperAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                        onClick={() => handleChangeStatus(enrollment)}
                      >
                        🔄 {t('actions.changeStatus')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(enrollment.enrollmentId, enrollment.studentName)}
                        disabled={deleting === enrollment.enrollmentId}
                      >
                        {deleting === enrollment.enrollmentId ? t('actions.deleting') : '🗑️'}
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    <EditGradesDialog
      enrollment={selectedEnrollment}
      isOpen={isEditGradesOpen}
      onClose={() => {
        setIsEditGradesOpen(false);
        setSelectedEnrollment(null);
      }}
      onSuccess={handleGradesEditSuccess}
    />
    
    <ChangeStatusDialog
      enrollment={selectedEnrollment}
      isOpen={isChangeStatusOpen}
      onClose={() => {
        setIsChangeStatusOpen(false);
        setSelectedEnrollment(null);
      }}
      onSuccess={handleStatusChangeSuccess}
    />
  </>
  );
}