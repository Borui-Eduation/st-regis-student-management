import { Timestamp } from 'firebase-admin/firestore';

/**
 * 用户角色类型
 */
export type UserRole = 'student' | 'admin' | 'it' | 'superadmin';

/**
 * 注册状态类型
 */
export type EnrollmentStatus = 'pending' | 'ready' | 'open' | 'rejected';

/**
 * 邮件类型
 */
export type EmailType = 'course_opened' | 'it_notification' | 'rejection' | 'confirmation';

/**
 * 学生接口
 */
export interface Student {
  studentId: string;
  name: string;
  email: string | null;
  phone?: string;
  school: string;
  grade?: number;             // 年级
  status: 'active' | 'inactive';
  currentCourses: number;
  maxCoursesPerSemester: number;  // 每学期最多课程数（默认4）
  // 财务信息
  totalPaid: number;          // 累计已支付
  totalOwed: number;          // 累计欠费
  // 家长信息
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 课程接口
 */
export interface Course {
  courseId: string;
  courseName: string;
  subject: string;
  category: CourseCategory;  // 文科/理科分类
  gradeLevel: number | null;
  teacherName: string | null;
  academicYear: string;
  semester: string;
  currentEnrollment: number;
  maxEnrollment?: number;     // 可选：不限人数则为 null
  minEnrollment?: number;     // 最小开课人数
  basePrice: number;          // 基础价格（CAD）
  description?: string;
  syllabus?: string;          // 课程大纲
  credits?: number;           // 学分
  status: 'active' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 审批历史记录
 */
export interface ApprovalHistory {
  status: EnrollmentStatus;
  timestamp: Timestamp | string;
  actor: string; // email or 'system'
  comments?: string;
  moodleEnrolId?: string;
}

/**
 * Moodle 信息
 */
export interface MoodleInfo {
  enrolled: boolean;
  moodleCourseId?: string;
  moodleUserId?: string;
  enrolledAt?: Timestamp;
  courseUrl?: string;
}

/**
 * 支付方式类型
 */
export type PaymentMethod = 'credit_card' | 'wechat' | 'alipay' | 'emt' | 'manual';

/**
 * 课程类别（影响价格）
 */
export type CourseCategory = 'arts' | 'science';

/**
 * 支付信息
 */
export interface PaymentInfo {
  paid: boolean;
  paidAt: Timestamp | null;
  amount: number;
  basePrice: number;        // 基础价格（根据课程类别）
  finalPrice: number;       // 最终价格（含支付方式费用）
  method: PaymentMethod;
  transactionId?: string;
  currency: string;         // 货币类型（CAD/USD/CNY）
  paymentFee?: number;      // 支付手续费
}

/**
 * 注册记录接口
 */
export interface Enrollment {
  enrollmentId: string;
  
  // 学生信息
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  
  // 课程信息
  courseId: string;
  courseName: string;
  courseCode?: string;
  
  // 教师信息
  teacherName: string | null;
  
  // 学期信息
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  
  // 成绩信息
  midtermMark?: string | number;
  midtermComments?: string;
  finalGrade?: number | null;
  finalComments?: string;
  
  // 状态信息
  status: EnrollmentStatus;
  myEdBCStatus?: string;
  
  // 审批历史
  approvalHistory: ApprovalHistory[];
  
  // Moodle 信息
  moodleInfo?: MoodleInfo;
  
  // 支付信息
  payment: PaymentInfo;
  
  // 元数据
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 购物车项目
 */
export interface CartItem {
  courseId: string;
  courseName: string;
  teacherName: string | null;
  price: number;
  academicYear: string;
  semester: string;
}

/**
 * 购物车接口
 */
export interface Cart {
  cartId?: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 邮件记录接口
 */
export interface EmailLog {
  emailId: string;
  to: string;
  type: EmailType;
  enrollmentId: string;
  subject: string;
  sentAt: Timestamp;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

/**
 * Cloud Task 负载类型
 */
export interface EnrollmentTaskPayload {
  enrollmentIds: string[];
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailTaskPayload {
  to: string;
  type: EmailType;
  data: any;
  enrollmentId?: string;
}

export interface MoodleTaskPayload {
  enrollmentId: string;
  studentEmail: string;
  courseName: string;
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

