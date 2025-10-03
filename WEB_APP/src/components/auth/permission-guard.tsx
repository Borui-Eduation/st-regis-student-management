'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { UserRole } from '@/lib/permissions';
import { ReactNode } from 'react';

interface PermissionGuardProps {
  children: ReactNode;
  /**
   * 允许的角色列表
   */
  allowedRoles?: UserRole[];
  /**
   * 需要的权限
   */
  requiredPermission?: keyof ReturnType<typeof usePermissions>['permissions'];
  /**
   * 没有权限时显示的内容
   */
  fallback?: ReactNode;
}

/**
 * 权限保护组件
 * 用于在UI层面控制内容显示
 */
export function PermissionGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallback = null,
}: PermissionGuardProps) {
  const { role, can, isLoading } = usePermissions();

  if (isLoading) {
    return null; // 或者返回加载状态
  }

  // 检查角色权限
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  // 检查具体权限
  if (requiredPermission && !can(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * 学生专用保护组件
 */
export function StudentOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard allowedRoles={['student']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * 管理员及以上保护组件
 */
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard allowedRoles={['admin', 'superadmin']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * IT及以上保护组件
 */
export function ITOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard allowedRoles={['superadmin']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * 超级管理员专用保护组件
 */
export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard allowedRoles={['superadmin']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}



