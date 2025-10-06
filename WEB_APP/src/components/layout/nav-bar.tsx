'use client';

import { usePathname, useRouter, Link } from '@/i18n/routing';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function NavBar() {
  const t = useTranslations('nav');
  const tRoles = useTranslations('roles');
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 根据角色显示不同的导航菜单
  const getNavigationByRole = () => {
    const role = session?.user?.role;
    
    // 未登录用户 - 不显示导航
    if (!role) {
      return [];
    }

    // 学生用户 - 只看到学生相关功能
    if (role === 'student') {
      return [
        { name: t('courseSelection'), href: '/student', icon: '🎓' },
        { name: t('myCourses'), href: '/student/courses', icon: '📚' },
        { name: t('myProfile'), href: '/student/profile', icon: '👤' },
      ];
    }

    // 中介用户 - 只看到中介相关功能
    if (role === 'agent') {
      return [
        { name: t('dashboard'), href: '/agent', icon: '📊' },
        { name: t('myStudents'), href: '/agent?tab=students', icon: '👥' },
        { name: t('enrollmentRecords'), href: '/agent?tab=enrollments', icon: '📝' },
      ];
    }

    // 管理员 - 看到学生管理功能
    if (role === 'admin') {
      return [
        { name: t('studentManagement'), href: '/admin', icon: '👨‍🎓' },
        { name: t('agentManagement'), href: '/admin/agents', icon: '🤝' },
        { name: t('financeManagement'), href: '/admin/finance', icon: '💰' },
      ];
    }
    
    // 超级管理员 - 额外看到用户管理和 Moodle 管理
    if (role === 'superadmin') {
      return [
        { name: t('studentManagement'), href: '/admin', icon: '👨‍🎓' },
        { name: t('agentManagement'), href: '/admin/agents', icon: '🤝' },
        { name: t('financeManagement'), href: '/admin/finance', icon: '💰' },
        { name: t('userManagement'), href: '/superadmin', icon: '👑' },
        { name: t('moodle'), href: '/superadmin/moodle', icon: '📚' },
      ];
    }

    return [];
  };

  const filteredNavigation = getNavigationByRole();

  // 获取用户首字母
  const getUserInitial = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // 获取角色标签
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: tRoles('student'),
      agent: tRoles('agent'),
      admin: tRoles('admin'),
      it: tRoles('it'),
      superadmin: tRoles('superadmin'),
    };
    return labels[role] || role;
  };

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      student: 'from-blue-500 to-indigo-500',
      agent: 'from-teal-500 to-cyan-500',
      admin: 'from-purple-500 to-pink-500',
      it: 'from-green-500 to-teal-500',
      superadmin: 'from-red-500 to-orange-500',
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                St Regis
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      console.log('🔍 Navigating to:', item.href);
                      router.push(item.href);
                    }}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {status === 'authenticated' && session?.user ? (
              <>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                
                {/* 用户下拉菜单 */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getRoleColor(session.user.role)} flex items-center justify-center text-white text-sm font-semibold`}>
                      {getUserInitial()}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-700">
                        {session.user.name || session.user.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getRoleLabel(session.user.role)}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* 下拉菜单 */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {session.user.name || t('user')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session.user.email}
                        </p>
                        <div className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(session.user.role)} text-white`}>
                          {getRoleLabel(session.user.role)}
                        </div>
                      </div>

                      {/* 根据角色显示对应的快捷菜单 */}
                      {session.user.role === 'student' && (
                        <>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/student');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">🎓</span>
                            {t('courseSelection')}
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/student/courses');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">📚</span>
                            {t('myCourses')}
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/student/profile');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">👤</span>
                            {t('myProfile')}
                          </button>
                        </>
                      )}

                      {session.user.role === 'agent' && (
                        <>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/agent');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">📊</span>
                            {t('dashboard')}
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/agent?tab=students');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">👥</span>
                            {t('myStudents')}
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/agent?tab=enrollments');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">📝</span>
                            {t('enrollmentRecords')}
                          </button>
                        </>
                      )}

                      {(session.user.role === 'admin' || session.user.role === 'superadmin') && (
                        <>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/admin');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">👨‍🎓</span>
                            {t('studentManagement')}
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/admin/agents');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">🤝</span>
                            {t('agentManagement')}
                          </button>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/admin/finance');
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-2">💰</span>
                            {t('financeManagement')}
                          </button>
                          {session.user.role === 'superadmin' && (
                            <>
                              <button
                                onClick={() => {
                                  setDropdownOpen(false);
                                  router.push('/superadmin');
                                }}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-200"
                              >
                                <span className="mr-2">👑</span>
                                {t('userManagement')}
                              </button>
                              <button
                                onClick={() => {
                                  setDropdownOpen(false);
                                  router.push('/superadmin/moodle');
                                }}
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <span className="mr-2">📚</span>
                                {t('moodleManagement')}
                              </button>
                            </>
                          )}
                        </>
                      )}

                      {/* 通用功能 */}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut({ callbackUrl: '/auth/signin' });
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span className="mr-2">🚪</span>
                        {t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : status === 'loading' ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="hidden md:block w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="flex justify-around py-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => {
                  console.log('📱 Mobile nav click:', item.href);
                  router.push(item.href);
                }}
                className={`flex flex-col items-center px-3 py-2 text-xs font-medium ${
                  isActive ? 'text-blue-700' : 'text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                {item.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

