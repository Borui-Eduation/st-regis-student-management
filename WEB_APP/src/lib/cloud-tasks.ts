import { CloudTasksClient } from '@google-cloud/tasks';
import type { 
  EnrollmentTaskPayload, 
  EmailTaskPayload, 
  MoodleTaskPayload 
} from '@/types';

const client = new CloudTasksClient();

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'borui-education';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const QUEUE_NAME = process.env.CLOUD_TASKS_QUEUE_NAME || 'enrollment-processing';

/**
 * 创建 Cloud Task
 */
async function createTask(options: {
  queue: string;
  functionName: string;
  payload: any;
  scheduleTime?: Date;
  taskName?: string;
}) {
  const { queue, functionName, payload, scheduleTime, taskName } = options;

  const parent = client.queuePath(PROJECT_ID, LOCATION, queue);
  
  const functionUrl = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/${functionName}`;
  
  const task: any = {
    httpRequest: {
      httpMethod: 'POST',
      url: functionUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      oidcToken: {
        serviceAccountEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      },
    },
  };

  // 设置延迟执行时间
  if (scheduleTime) {
    task.scheduleTime = {
      seconds: Math.floor(scheduleTime.getTime() / 1000),
    };
  }

  // 设置任务名称（用于去重）
  if (taskName) {
    task.name = client.taskPath(PROJECT_ID, LOCATION, queue, taskName);
  }

  try {
    const [response] = await client.createTask({ parent, task });
    return response;
  } catch (error: any) {
    // 如果任务已存在（去重），忽略错误
    if (error.code === 6) { // ALREADY_EXISTS
      return null;
    }
    throw error;
  }
}

/**
 * 创建注册处理任务
 */
export async function createEnrollmentProcessingTask(
  payload: EnrollmentTaskPayload,
  options?: { scheduleTime?: Date; taskName?: string }
) {
  return createTask({
    queue: QUEUE_NAME,
    functionName: 'processEnrollments',
    payload,
    scheduleTime: options?.scheduleTime,
    taskName: options?.taskName,
  });
}

/**
 * 创建邮件发送任务
 */
export async function createEmailTask(
  payload: EmailTaskPayload,
  options?: { scheduleTime?: Date; taskName?: string }
) {
  return createTask({
    queue: 'email-queue',
    functionName: 'sendEmail',
    payload,
    scheduleTime: options?.scheduleTime,
    taskName: options?.taskName,
  });
}

/**
 * 创建 Moodle 开课任务
 */
export async function createMoodleEnrollmentTask(
  payload: MoodleTaskPayload,
  options?: { scheduleTime?: Date; taskName?: string }
) {
  return createTask({
    queue: 'moodle-queue',
    functionName: 'enrollInMoodle',
    payload,
    scheduleTime: options?.scheduleTime,
    taskName: options?.taskName,
  });
}

/**
 * 批量创建任务（用于高并发场景）
 */
export async function createBatchTasks<T>(
  taskCreator: (payload: T, options?: any) => Promise<any>,
  payloads: T[],
  batchSize: number = 100
) {
  const results = [];
  
  // 分批处理
  for (let i = 0; i < payloads.length; i += batchSize) {
    const batch = payloads.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(payload => taskCreator(payload))
    );
    results.push(...batchResults);
  }
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { successful, failed, results };
}

/**
 * 取消任务（如果需要）
 */
export async function cancelTask(taskName: string) {
  try {
    await client.deleteTask({ name: taskName });
  } catch (error) {
    throw new Error(`Failed to cancel task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

