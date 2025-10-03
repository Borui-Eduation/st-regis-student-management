/**
 * 邮件发送函数
 * 
 * 通过 Cloud Tasks 调用，支持大量并发邮件发送
 */

import * as functions from 'firebase-functions';
import { Resend } from 'resend';
import * as admin from 'firebase-admin';

const resend = new Resend(process.env.RESEND_API_KEY);
const db = admin.firestore();

interface EmailTaskPayload {
  to: string;
  type: 'course_opened' | 'it_notification' | 'rejection' | 'confirmation';
  data: any;
  enrollmentId?: string;
}

export const sendEmail = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
    maxInstances: 500,
  })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const payload = req.body as EmailTaskPayload;

    try {
      const { to, type, data, enrollmentId } = payload;

      if (!to || !type) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      let emailResult;

      switch (type) {
        case 'course_opened':
          emailResult = await sendCourseOpenedEmail(to, data);
          break;
        case 'it_notification':
          emailResult = await sendITNotificationEmail(to, data);
          break;
        case 'rejection':
          emailResult = await sendRejectionEmail(to, data);
          break;
        case 'confirmation':
          emailResult = await sendConfirmationEmail(to, data);
          break;
        default:
          res.status(400).json({ error: 'Invalid email type' });
          return;
      }

      // 记录邮件发送
      if (emailResult.data) {
        await db.collection('emails').add({
          emailId: emailResult.data.id,
          to,
          type,
          enrollmentId: enrollmentId || null,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'sent',
        });
      }

      res.status(200).json({
        success: true,
        emailId: emailResult.data?.id,
      });

    } catch (error: any) {
      console.error('Email sending error:', error);

      // 记录失败
      if (payload.enrollmentId) {
        await db.collection('emails').add({
          enrollmentId: payload.enrollmentId,
          to: payload.to,
          type: payload.type,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'failed',
          error: error.message,
        });
      }

      res.status(500).json({ error: error.message });
    }
  });

/**
 * 课程开课通知（发送给学生）
 */
async function sendCourseOpenedEmail(to: string, data: any) {
  const { studentName, courseName, teacherName, moodleCourseUrl, academicYear, semester, startDate } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .info-item {
      margin: 10px 0;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      display: inline-block;
      width: 100px;
    }
    .button {
      display: inline-block;
      background: #4CAF50;
      color: white !important;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 您的课程已开课！</h1>
  </div>
  <div class="content">
    <p>亲爱的 <strong>${studentName}</strong>，</p>
    <p>恭喜您！您注册的课程已在 Moodle 平台成功开课，现在可以开始学习了。</p>
    
    <div class="info-box">
      <h3 style="margin-top: 0;">📚 课程信息</h3>
      <div class="info-item">
        <span class="info-label">课程名称:</span>
        <span>${courseName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">教师:</span>
        <span>${teacherName || '待定'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">学期:</span>
        <span>${academicYear} - ${semester}</span>
      </div>
      <div class="info-item">
        <span class="info-label">开始日期:</span>
        <span>${startDate}</span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${moodleCourseUrl}" class="button">立即访问课程 →</a>
    </div>

    <div class="info-box">
      <h4>📝 接下来的步骤：</h4>
      <ol>
        <li>点击上方按钮访问 Moodle 课程页面</li>
        <li>使用您的学生账号登录</li>
        <li>查看课程大纲和学习材料</li>
        <li>按时完成作业和考试</li>
      </ol>
    </div>

    <p style="margin-top: 30px;">如有任何问题，请随时联系我们的支持团队。</p>
    <p>祝您学习愉快！</p>
    
    <p style="margin-top: 20px;">
      <strong>St Regis Education Team</strong>
    </p>
  </div>
  
  <div class="footer">
    <p>此邮件由系统自动发送，请勿直接回复。</p>
    <p>© 2025 St Regis Education. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  return await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@stregis.edu',
    to,
    subject: `🎉 课程开课通知 - ${courseName}`,
    html,
  });
}

/**
 * IT 通知（课程待开课）
 */
async function sendITNotificationEmail(to: string, data: any) {
  const { studentName, studentEmail, courseName, academicYear, semester, enrollmentId } = data;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/it/dashboard`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #2196F3;
      color: white;
      padding: 20px;
      border-radius: 5px;
    }
    .content {
      padding: 20px;
      background: #f5f5f5;
      margin-top: 20px;
      border-radius: 5px;
    }
    .button {
      display: inline-block;
      background: #FF9800;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      margin: 15px 0;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    td:first-child {
      font-weight: 600;
      width: 120px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🔔 新课程待开课</h2>
  </div>
  <div class="content">
    <p>以下课程已通过管理员审批，请在 Moodle 中为学生开课：</p>
    
    <table>
      <tr>
        <td>学生姓名:</td>
        <td>${studentName}</td>
      </tr>
      <tr>
        <td>学生邮箱:</td>
        <td>${studentEmail}</td>
      </tr>
      <tr>
        <td>课程名称:</td>
        <td>${courseName}</td>
      </tr>
      <tr>
        <td>学期:</td>
        <td>${academicYear} - ${semester}</td>
      </tr>
      <tr>
        <td>注册ID:</td>
        <td>${enrollmentId}</td>
      </tr>
    </table>

    <a href="${dashboardUrl}" class="button">前往 IT 管理面板 →</a>

    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      请在 Moodle 中完成以下操作：<br>
      1. 创建或确认学生账号<br>
      2. 将学生添加到对应课程<br>
      3. 在系统中标记为"已开课"
    </p>
  </div>
</body>
</html>
  `;

  return await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@stregis.edu',
    to,
    subject: `待开课通知 - ${courseName}`,
    html,
  });
}

/**
 * 拒绝通知
 */
async function sendRejectionEmail(to: string, data: any) {
  const { studentName, courseName, reason } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #f44336;
      color: white;
      padding: 20px;
      border-radius: 5px;
    }
    .content {
      padding: 20px;
      background: #fff3e0;
      margin-top: 20px;
      border-radius: 5px;
    }
    .reason-box {
      background: white;
      padding: 15px;
      border-left: 4px solid #f44336;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>课程注册通知</h2>
  </div>
  <div class="content">
    <p>亲爱的 <strong>${studentName}</strong>，</p>
    <p>很抱歉，您的课程注册 <strong>${courseName}</strong> 未通过审核。</p>
    
    <div class="reason-box">
      <strong>原因:</strong><br>
      ${reason || '未提供具体原因'}
    </div>

    <p>如有疑问，请联系管理员获取更多信息。</p>
    
    <p>感谢您的理解。</p>
    <p><strong>St Regis Education Team</strong></p>
  </div>
</body>
</html>
  `;

  return await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@stregis.edu',
    to,
    subject: `课程注册通知 - ${courseName}`,
    html,
  });
}

/**
 * 确认通知（注册成功）
 */
async function sendConfirmationEmail(to: string, data: any) {
  const { studentName, courses, totalAmount } = data;

  const courseList = courses.map((c: any) => 
    `<li>${c.courseName} - ${c.academicYear} ${c.semester}</li>`
  ).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #4CAF50;
      color: white;
      padding: 20px;
      border-radius: 5px;
    }
    .content {
      padding: 20px;
      background: #f5f5f5;
      margin-top: 20px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>✅ 注册申请已提交</h2>
  </div>
  <div class="content">
    <p>亲爱的 <strong>${studentName}</strong>，</p>
    <p>您的课程注册申请已成功提交，正在等待管理员审批。</p>
    
    <h3>已选课程：</h3>
    <ul>
      ${courseList}
    </ul>
    
    <p><strong>总金额:</strong> $${totalAmount}</p>
    
    <p>我们会在审批完成后通过邮件通知您。</p>
    <p><strong>St Regis Education Team</strong></p>
  </div>
</body>
</html>
  `;

  return await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@stregis.edu',
    to,
    subject: '课程注册确认',
    html,
  });
}

