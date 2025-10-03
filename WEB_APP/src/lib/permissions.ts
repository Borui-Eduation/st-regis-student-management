/**
 * 权限配置文件
 * 定义管理员的白名单
 * 注意：IT角色已移除 - Moodle集成已自动化
 */

export type UserRole = 'student' | 'agent' | 'admin' | 'superadmin';

/**
 * 超级管理员白名单（拥有所有权限）
 */
export const SUPERADMIN_EMAILS = [
  'yao.s.1216@gmail.com',  // Yao - 超级管理员
  'superadmin@borui.org',
  // 在这里添加超级管理员邮箱
] as const;

/**
 * 中介白名单（可推荐学生、注册课程）🆕
 */
export const AGENT_EMAILS = [
  'agent@borui.org',
  // 在这里添加更多中介邮箱
] as const;

/**
 * 管理员白名单（可管理学生、课程、财务）
 */
export const ADMIN_EMAILS = [
  'admin@borui.org',
  'admin@stregis.edu',
  // 在这里添加更多管理员邮箱
] as const;

/**
 * 检查邮箱是否是中介
 */
export function isAgentEmail(email: string): boolean {
  return AGENT_EMAILS.includes(email as any);
}

/**
 * 检查邮箱是否是管理员
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email as any);
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
  if (isAdminEmail(email)) {
    return 'admin';
  }
  if (isAgentEmail(email)) {
    return 'agent';
  }
  return 'student';
}

/**
 * 权限定义（细粒度）
 */
export const PERMISSIONS = {
  // 学生权限 - 只能查看自己的信息
  student: {
    // 个人信息
    'profile:view:own': true,
    'profile:edit:own': false,           // ❌ 不能自己修改，由Agent/Admin修改
    
    // 课程
    'courses:view:all': true,            // 可以查看课程列表
    'courses:create': false,
    'courses:edit': false,
    'courses:delete': false,
    
    // 注册
    'enrollments:view:own': true,        // 只能查看自己的注册
    'enrollments:create': false,         // ❌ 不能自己注册，由Agent/Admin代为注册
    'enrollments:edit:own': false,
    'enrollments:delete:own': false,
    
    // 支付
    'payments:view:own': true,
    'payments:create': false,            // ❌ 不能自己创建支付，由Agent/Admin创建
    
    // 学生管理
    'students:view:own': true,
    'students:view:all': false,
    'students:create': false,
    'students:edit': false,
    'students:delete': false,
    'students:change-status': false,
  },
  
  // 中介权限 - 可以管理自己推荐的学生 🆕
  agent: {
    // 个人信息
    'profile:view:own': true,
    'profile:edit:own': true,
    
    // 课程
    'courses:view:all': true,            // 可以查看所有课程
    'courses:create': false,             // ❌ 不能创建课程
    'courses:edit': false,               // ❌ 不能编辑课程
    'courses:delete': false,             // ❌ 不能删除课程
    
    // 学生管理（限制：只能管理自己推荐的学生）
    'students:view:own': true,           // 查看自己推荐的学生
    'students:view:all': false,          // ❌ 不能查看其他Agent的学生
    'students:create': true,             // ✅ 可以创建学生
    'students:edit:own': true,           // ✅ 可以编辑自己推荐的学生
    'students:edit:all': false,          // ❌ 不能编辑其他Agent的学生
    'students:delete': false,            // ❌ 不能删除学生
    'students:change-status': false,     // ❌ 不能修改学生状态（active/inactive）
    
    // 注册管理（限制：只能为自己的学生注册）
    'enrollments:view:own-students': true,
    'enrollments:view:all': false,
    'enrollments:create:for-own-students': true,  // ✅ 可以为自己的学生添加课程
    'enrollments:edit:own-students': false,       // ❌ 不能修改已注册的课程
    'enrollments:delete': false,                  // ❌ 不能删除注册记录
    'enrollments:approve': false,
    
    // 支付管理（限制：只能为自己的学生）
    'payments:view:own-students': true,
    'payments:create:for-own-students': true,     // ✅ 可以为学生创建支付
    'payments:mark-paid:own-students': true,      // ✅ 可以标记已支付
    'payments:refund': false,                     // ❌ 不能处理退款
    
    // 报表
    'reports:view:own': true,            // 查看自己的统计数据
    'reports:view:all': false,
  },
  
  // 管理员权限 - 完全控制学生、课程和中介
  admin: {
    // 个人信息
    'profile:view:own': true,
    'profile:edit:own': true,
    
    // 课程（完全控制）
    'courses:view:all': true,
    'courses:create': true,              // ✅ 可以创建课程
    'courses:edit': true,                // ✅ 可以编辑课程
    'courses:delete': true,              // ✅ 可以删除课程
    
    // 学生管理（完全控制）
    'students:view:all': true,           // ✅ 查看所有学生（包括所有Agent的）
    'students:create': true,             // ✅ 可以创建学生
    'students:edit': true,               // ✅ 可以编辑任何学生
    'students:delete': true,             // ✅ 可以删除学生
    'students:change-status': true,      // ✅ 可以修改学生状态
    
    // 注册管理（完全控制）
    'enrollments:view:all': true,
    'enrollments:create': true,
    'enrollments:edit': true,
    'enrollments:delete': true,
    'enrollments:approve': true,         // ✅ 可以审批注册
    
    // 支付管理（完全控制）
    'payments:view:all': true,
    'payments:create': true,
    'payments:mark-paid': true,
    'payments:refund': true,             // ✅ 可以处理退款
    
    // 报表
    'reports:view:all': true,
    
    // 中介管理（完全控制）
    'agents:view': true,                 // ✅ 可以查看Agent
    'agents:create': true,               // ✅ 可以创建Agent
    'agents:edit': true,                 // ✅ 可以编辑Agent
    'agents:delete': true,               // ✅ 可以删除Agent
    
    // 其他
    'users:change-role': false,          // ❌ 不能修改用户角色（仅Superadmin）
  },
  
  // 超级管理员权限（所有权限）
  superadmin: {
    // 通配符：所有权限
    '*': true,
    
    // 明确额外权限
    'agents:create': true,
    'agents:edit': true,
    'agents:delete': true,
    'agents:view': true,
    'users:change-role': true,
    'system:settings': true,
    'audit-logs:view': true,
  },
} as const;

/**
 * 检查用户是否有特定权限
 */
export function hasPermission(
  role: UserRole,
  permission: string
): boolean {
  // SuperAdmin拥有所有权限
  if (role === 'superadmin') {
    return true;
  }
  
  const rolePermissions = PERMISSIONS[role] as Record<string, boolean>;
  return rolePermissions[permission] ?? false;
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
  agent: 1,
  admin: 2,
  superadmin: 3,
} as const;

/**
 * 检查角色A是否高于或等于角色B
 */
export function isRoleHigherOrEqual(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}
