/**
 * 权限配置文件
 * 定义管理员和IT人员的白名单
 */

export type UserRole = 'student' | 'admin' | 'it' | 'superadmin';

/**
 * 超级管理员白名单（拥有所有权限）
 */
export const SUPERADMIN_EMAILS = [
  'yao.s.1216@gmail.com',  // Yao - 超级管理员
  'superadmin@borui.org',
  // 在这里添加超级管理员邮箱
] as const;

/**
 * 管理员白名单（只有这些邮箱可以成为管理员）
 */
export const ADMIN_EMAILS = [
  'admin@borui.org',
  'admin@stregis.edu',
  // 在这里添加更多管理员邮箱
] as const;

/**
 * IT管理员白名单（只有这些邮箱可以成为IT）
 */
export const IT_EMAILS = [
  'it@borui.org',
  'tech@stregis.edu',
  // 在这里添加更多IT邮箱
] as const;

/**
 * 检查邮箱是否是管理员
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email as any);
}

/**
 * 检查邮箱是否是IT
 */
export function isITEmail(email: string): boolean {
  return IT_EMAILS.includes(email as any);
}

/**
 * 检查邮箱是否是超级管理员
 */
export function isSuperAdminEmail(email: string): boolean {
  return SUPERADMIN_EMAILS.includes(email as any);
}

/**
 * 根据邮箱分配角色
 */
export function assignRoleByEmail(email: string): UserRole {
  if (isSuperAdminEmail(email)) {
    return 'superadmin';
  }
  if (isITEmail(email)) {
    return 'it';
  }
  if (isAdminEmail(email)) {
    return 'admin';
  }
  return 'student';
}

/**
 * 权限定义
 */
export const PERMISSIONS = {
  // 学生权限
  student: {
    canEnrollCourses: true,      // 可以注册课程
    canViewOwnCourses: true,     // 可以查看自己的课程
    canMakePayment: true,        // 可以缴费
    canViewOwnProfile: true,     // 可以查看自己的资料
    canEditOwnProfile: true,     // 可以编辑自己的资料
    canViewAllCourses: true,     // 可以查看所有课程列表
    canViewAllStudents: false,   // 不能查看所有学生
    canApprove: false,           // 不能审批
    canOpenCourse: false,        // 不能开课
    canManageUsers: false,       // 不能管理用户
  },
  // 管理员权限
  admin: {
    canEnrollCourses: true,
    canViewOwnCourses: true,
    canMakePayment: true,
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canViewAllCourses: true,
    canViewAllStudents: true,    // 可以查看所有学生
    canApprove: true,            // 可以审批注册
    canOpenCourse: false,        // 不能开课（IT专属）
    canManageUsers: false,
  },
  // IT权限
  it: {
    canEnrollCourses: true,
    canViewOwnCourses: true,
    canMakePayment: true,
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canViewAllCourses: true,
    canViewAllStudents: true,
    canApprove: true,            // 可以审批
    canOpenCourse: true,         // 可以开课
    canManageUsers: true,        // 可以管理用户
  },
  // 超级管理员权限（所有权限）
  superadmin: {
    canEnrollCourses: true,
    canViewOwnCourses: true,
    canMakePayment: true,
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canViewAllCourses: true,
    canViewAllStudents: true,
    canApprove: true,
    canOpenCourse: true,
    canManageUsers: true,
  },
} as const;

/**
 * 检查用户是否有特定权限
 */
export function hasPermission(
  role: UserRole,
  permission: keyof typeof PERMISSIONS.student
): boolean {
  return PERMISSIONS[role][permission] ?? false;
}

/**
 * 获取用户所有权限
 */
export function getUserPermissions(role: UserRole) {
  return PERMISSIONS[role];
}

/**
 * 角色层级（用于权限比较）
 */
export const ROLE_HIERARCHY = {
  student: 0,
  admin: 1,
  it: 2,
  superadmin: 3,
} as const;

/**
 * 检查角色A是否高于或等于角色B
 */
export function isRoleHigherOrEqual(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

