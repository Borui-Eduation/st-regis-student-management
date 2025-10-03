'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, getUserPermissions, UserRole } from '@/lib/permissions';

/**
 * 权限检查 Hook
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const role = (session?.user?.role || 'student') as UserRole;

  return {
    role,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    permissions: getUserPermissions(role),
    
    // 便捷方法
    can: (permission: string) => {
      return hasPermission(role, permission);
    },
    
    // 角色检查
    isStudent: role === 'student',
    isAgent: role === 'agent',
    isAdmin: role === 'admin',
    isSuperAdmin: role === 'superadmin',
    
    // 至少是某个角色
    isAtLeastAgent: ['agent', 'admin', 'superadmin'].includes(role),
    isAtLeastAdmin: ['admin', 'superadmin'].includes(role),
  };
}



