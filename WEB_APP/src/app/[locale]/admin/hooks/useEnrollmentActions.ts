/**
 * Custom Hook: useEnrollmentActions
 * 管理注册审批操作（批准/拒绝）
 */

import { useState } from 'react';

export function useEnrollmentActions(onSuccess?: () => void) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`确认批准 ${studentName} 的注册吗？`)) return;

    setProcessing(enrollmentId);
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          adminEmail: 'admin@stregis.edu',
          comments: '已确认支付，批准注册',
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ 批准成功！\n\n注册 ID: ${enrollmentId}\n已发送 IT 通知邮件`);
        onSuccess?.();
      } else {
        alert('❌ 批准失败: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ 操作失败: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (enrollmentId: string, studentName: string) => {
    const reason = prompt(`请输入拒绝 ${studentName} 注册的原因:`);
    if (!reason) return;

    setProcessing(enrollmentId);
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          adminEmail: 'admin@stregis.edu',
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ 已拒绝！\n\n已发送通知邮件给学生`);
        onSuccess?.();
      } else {
        alert('❌ 操作失败: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ 操作失败: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  return {
    processing,
    handleApprove,
    handleReject,
  };
}



