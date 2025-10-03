/**
 * 定价配置
 * 根据课程类别和支付方式计算最终价格
 */

import { PaymentMethod, CourseCategory } from '@/types';

/**
 * 基础课程价格配置（CAD）
 */
export const BASE_PRICES: Record<CourseCategory, number> = {
  arts: 500,      // 文科基础价格
  science: 600,   // 理科基础价格
};

/**
 * 支付方式手续费配置（百分比）
 */
export const PAYMENT_FEES: Record<PaymentMethod, number> = {
  credit_card: 0.029,  // 2.9% 信用卡手续费
  wechat: 0.00,        // 微信无手续费
  alipay: 0.00,        // 支付宝无手续费
  emt: 0.00,           // EMT无手续费
  manual: 0.00,        // 手动支付无手续费
};

/**
 * 支付方式显示名称
 */
export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  credit_card: '信用卡 Credit Card',
  wechat: '微信支付 WeChat Pay',
  alipay: '支付宝 Alipay',
  emt: 'EMT (Interac e-Transfer)',
  manual: '手动支付 Manual Payment',
};

/**
 * 课程类别显示名称
 */
export const COURSE_CATEGORY_NAMES: Record<CourseCategory, string> = {
  arts: '文科 Arts',
  science: '理科 Science',
};

/**
 * 计算最终价格
 * @param category 课程类别
 * @param paymentMethod 支付方式
 * @returns { basePrice, fee, finalPrice }
 */
export function calculatePrice(category: CourseCategory, paymentMethod: PaymentMethod) {
  const basePrice = BASE_PRICES[category];
  const feeRate = PAYMENT_FEES[paymentMethod];
  const fee = Math.round(basePrice * feeRate * 100) / 100; // 保留2位小数
  const finalPrice = Math.round((basePrice + fee) * 100) / 100;

  return {
    basePrice,
    fee,
    feeRate,
    finalPrice,
    currency: 'CAD',
  };
}

/**
 * 格式化金额
 * @param amount 金额
 * @param currency 货币类型
 */
export function formatPrice(amount: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * 根据学科判断课程类别
 * @param subject 学科名称
 */
export function getCategoryBySubject(subject: string): CourseCategory {
  const scienceSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Science',
  ];

  const subjectUpper = subject.toUpperCase();
  
  if (scienceSubjects.some(s => subjectUpper.includes(s.toUpperCase()))) {
    return 'science';
  }
  
  return 'arts';
}

/**
 * 学生选课限制配置
 */
export const STUDENT_COURSE_LIMITS = {
  maxCoursesPerSemester: 4,  // 每学期最多4门课
  maxCoursesTotal: 20,       // 总共最多课程数（可选）
};

/**
 * 退款政策
 */
export const REFUND_POLICY = {
  allowRefund: false,        // 不允许退款
  cancellationDeadline: 0,   // 取消截止日期（天数，0表示不允许）
  refundPercentage: 0,       // 退款百分比
};

/**
 * 验证学生是否可以选课
 * @param currentCourses 当前已选课程数
 * @param maxCourses 最大课程数
 */
export function canEnrollMoreCourses(currentCourses: number, maxCourses: number = 4): boolean {
  return currentCourses < maxCourses;
}

/**
 * 根据科目获取课程基础价格
 * @param subject 课程科目
 * @returns 基础价格（CAD）
 */
export function getPriceForCourse(subject: string): number {
  const category = getCategoryBySubject(subject);
  return BASE_PRICES[category];
}

/**
 * 计算购物车总价
 * @param items 购物车项目
 */
export function calculateCartTotal(items: Array<{
  category: CourseCategory;
  paymentMethod: PaymentMethod;
}>): {
  subtotal: number;
  totalFees: number;
  total: number;
} {
  let subtotal = 0;
  let totalFees = 0;

  items.forEach(item => {
    const { basePrice, fee } = calculatePrice(item.category, item.paymentMethod);
    subtotal += basePrice;
    totalFees += fee;
  });

  return {
    subtotal,
    totalFees,
    total: subtotal + totalFees,
  };
}



