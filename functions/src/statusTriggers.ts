/**
 * Firestore 触发器 - 状态变更自动通知
 * 
 * 监听 enrollment 状态变化，自动发送通知邮件
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const db = admin.firestore();

export const onEnrollmentStatusChange = functions
  .firestore
  .document('enrollments/{enrollmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const enrollmentId = context.params.enrollmentId;

    try {
      // 1. pending → ready: 发送 IT 通知
      if (before.status === 'pending' && after.status === 'ready') {
        await sendITNotification(after, enrollmentId);
      }

      // 2. ready → open: 发送学生通知
      if (before.status === 'ready' && after.status === 'open') {
        await sendCourseOpenedNotification(after, enrollmentId);
      }

      // 3. * → rejected: 发送拒绝通知
      if (before.status !== 'rejected' && after.status === 'rejected') {
        await sendRejectionNotification(after, enrollmentId);
      }

    } catch (error: any) {
      console.error('Error in status trigger:', error);
      // 记录错误到 emails 集合
      await db.collection('emails').add({
        enrollmentId,
        type: 'error',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

/**
 * 发送 IT 通知（课程已批准，待开课）
 */
async function sendITNotification(enrollment: any, enrollmentId: string) {
  const itEmail = process.env.IT_EMAIL || 'it@stregis.edu';

  const emailHtml = `
    <h2>新课程待开课</h2>
    <p>以下课程已通过审批，请在 Moodle 中为学生开课：</p>
    <ul>
      <li><strong>学生:</strong> ${enrollment.studentName} (${enrollment.studentEmail})</li>
      <li><strong>课程:</strong> ${enrollment.courseName}</li>
      <li><strong>学期:</strong> ${enrollment.academicYear} - ${enrollment.semester}</li>
    </ul>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/it/dashboard">前往IT管理面板</a></p>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@stregis.edu',
    to: itEmail,
    subject: `待开课通知 - ${enrollment.courseName}`,
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send IT notification:', error);
    throw error;
  }

  // 记录邮件发送
  await db.collection('emails').add({
    emailId: data?.id,
    enrollmentId,
    to: itEmail,
    type: 'it_notification',
    subject: `待开课通知 - ${enrollment.courseName}`,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'sent',
  });

  console.log(`IT notification sent for enrollment ${enrollmentId}`);
}

/**
 * 发送课程开课通知（学生）
 */
async function sendCourseOpenedNotification(enrollment: any, enrollmentId: string) {
  if (!enrollment.studentEmail) {
    console.warn(`No email for student in enrollment ${enrollmentId}`);
    return;
  }

  const moodleCourseUrl = enrollment.moodleInfo?.courseUrl || 
    `${process.env.MOODLE_URL}/course/view.php?id=${enrollment.moodleInfo?.moodleCourseId || ''}`;

  const emailHtml = `
    <h2>🎉 您的课程已开课！</h2>
    <p>亲爱的 ${enrollment.studentName}，</p>
    <p>您的课程 <strong>${enrollment.courseName}</strong> 已在 Moodle 平台开课。</p>
    
    <h3>课程信息：</h3>
    <ul>
      <li><strong>课程名称:</strong> ${enrollment.courseName}</li>
      <li><strong>教师:</strong> ${enrollment.teacherName || '待定'}</li>
      <li><strong>学期:</strong> ${enrollment.academicYear} - ${enrollment.semester}</li>
      <li><strong>开始日期:</strong> ${enrollment.startDate}</li>
    </ul>

    <p><a href="${moodleCourseUrl}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">访问课程</a></p>
    
    <p>如有问题，请联系我们。</p>
    <p>祝学习愉快！</p>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@stregis.edu',
    to: enrollment.studentEmail,
    subject: `课程开课通知 - ${enrollment.courseName}`,
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send course opened notification:', error);
    throw error;
  }

  // 记录邮件发送
  await db.collection('emails').add({
    emailId: data?.id,
    enrollmentId,
    to: enrollment.studentEmail,
    type: 'course_opened',
    subject: `课程开课通知 - ${enrollment.courseName}`,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'sent',
  });

  console.log(`Course opened notification sent to ${enrollment.studentEmail}`);
}

/**
 * 发送拒绝通知
 */
async function sendRejectionNotification(enrollment: any, enrollmentId: string) {
  if (!enrollment.studentEmail) {
    return;
  }

  const latestHistory = enrollment.approvalHistory?.[enrollment.approvalHistory.length - 1];
  const reason = latestHistory?.comments || '未提供原因';

  const emailHtml = `
    <h2>课程注册未通过</h2>
    <p>亲爱的 ${enrollment.studentName}，</p>
    <p>很抱歉，您的课程注册 <strong>${enrollment.courseName}</strong> 未通过审核。</p>
    
    <p><strong>原因:</strong> ${reason}</p>
    
    <p>如有疑问，请联系管理员。</p>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@stregis.edu',
    to: enrollment.studentEmail,
    subject: `课程注册通知 - ${enrollment.courseName}`,
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send rejection notification:', error);
    throw error;
  }

  // 记录邮件发送
  await db.collection('emails').add({
    emailId: data?.id,
    enrollmentId,
    to: enrollment.studentEmail,
    type: 'rejection',
    subject: `课程注册通知 - ${enrollment.courseName}`,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'sent',
  });

  console.log(`Rejection notification sent to ${enrollment.studentEmail}`);
}

