/**
 * Superadmin User Management Page
 * 超级管理员用户管理页面
 * 
 * 功能：
 * - 查看所有系统用户（admin, agent, superadmin）
 * - 创建新的系统用户
 * - 修改用户角色
 * - 删除用户
 * 
 * 注意：不涉及普通学生管理（学生由admin管理）
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'admin' | 'agent' | 'teacher' | 'superadmin';
  status: string;
  createdAt?: string;
}

export default function SuperadminPage() {
  const t = useTranslations('pages.superadmin');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [includeStudents, setIncludeStudents] = useState(false); // 是否显示学生
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词
  const [roleFilter, setRoleFilter] = useState<string>('all'); // 角色筛选
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin' as 'student' | 'admin' | 'agent' | 'teacher' | 'superadmin',
  });

  // 权限检查
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'superadmin') {
      router.push('/unauthorized');
    }
  }, [session, status, router]);

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = `/api/superadmin/users?includeStudents=${includeStudents}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'superadmin') {
      fetchUsers();
    }
  }, [session, includeStudents]); // 依赖 includeStudents

  // 创建用户
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      alert(t('errors.fillRequired'));
      return;
    }
    
    setProcessing(true);
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(t('createSuccess'));
        setIsCreateDialogOpen(false);
        setFormData({ name: '', email: '', phone: '', role: 'admin' });
        fetchUsers();
      } else {
        alert(t('errors.createFailed') + ': ' + data.error);
      }
    } catch (error: any) {
      alert(t('errors.operationFailed') + ': ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(t('confirmDelete', { name: userName }))) {
      return;
    }
    
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(t('deleteSuccess'));
        fetchUsers();
      } else {
        alert(t('errors.deleteFailed') + ': ' + data.error);
      }
    } catch (error: any) {
      alert(t('errors.operationFailed') + ': ' + error.message);
    }
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (user: SystemUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  // 更新用户
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser || !formData.name || !formData.email || !formData.role) {
      alert(t('errors.fillRequired'));
      return;
    }
    
    setProcessing(true);
    try {
      const res = await fetch(`/api/superadmin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('用户更新成功');
        setIsEditDialogOpen(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', phone: '', role: 'admin' });
        fetchUsers();
      } else {
        alert('更新失败: ' + data.error);
      }
    } catch (error: any) {
      alert(t('errors.operationFailed') + ': ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 角色显示
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      student: { label: tRoles('student'), className: 'bg-gray-100 text-gray-800' },
      admin: { label: tRoles('admin'), className: 'bg-blue-100 text-blue-800' },
      teacher: { label: tRoles('teacher'), className: 'bg-green-100 text-green-800' },
      agent: { label: tRoles('agent'), className: 'bg-purple-100 text-purple-800' },
      superadmin: { label: tRoles('superadmin'), className: 'bg-red-100 text-red-800' },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { 
      label: role, 
      className: 'bg-gray-100 text-gray-800' 
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // 过滤用户列表
  const filteredUsers = users.filter(user => {
    // 角色筛选
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }
    
    // 搜索关键词
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{tCommon('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">👑 {t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{tRoles('admin')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{tRoles('teacher')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'teacher').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{tRoles('agent')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'agent').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{tRoles('superadmin')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'superadmin').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{tRoles('student')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {users.filter(u => u.role === 'student').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('userList.title')}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{tCommon('total', { count: filteredUsers.length })}</p>
              </div>
              <div className="flex items-center gap-4">
                {/* 显示学生开关 */}
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStudents}
                    onChange={(e) => setIncludeStudents(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span>{t('showStudents') || '显示学生'}</span>
                </label>
                
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  ➕ {t('createUser')}
                </Button>
              </div>
            </div>

            {/* 搜索和过滤栏 */}
            <div className="mt-4 flex gap-4">
              {/* 搜索框 */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder') || '搜索姓名、邮箱或电话...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* 角色筛选 */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('roleFilter.all') || '所有角色'}</option>
                <option value="student">{tRoles('student')}</option>
                <option value="admin">{tRoles('admin')}</option>
                <option value="teacher">{tRoles('teacher')}</option>
                <option value="agent">{tRoles('agent')}</option>
                <option value="superadmin">{tRoles('superadmin')}</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">加载中...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">{searchQuery || roleFilter !== 'all' ? '没有找到匹配的用户' : '暂无系统用户'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('userList.name')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('userList.email')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('userList.phone')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('userList.role')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{tCommon('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status === 'active' ? '活跃' : '停用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenEditDialog(user)}
                            >
                              ✏️ 编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                            >
                              🗑️ {tCommon('delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建系统用户</DialogTitle>
              <DialogDescription>
                创建管理员、教师、中介或超级管理员账号
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('dialog.fields.name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('dialog.placeholders.name')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">{t('dialog.fields.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('dialog.placeholders.email')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">{t('dialog.fields.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('dialog.placeholders.phone')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">{t('dialog.fields.role')} *</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    required
                  >
                    <option value="admin">管理员（Admin）</option>
                    <option value="teacher">教师（Teacher）</option>
                    <option value="agent">中介（Agent）</option>
                    <option value="superadmin">超级管理员（Superadmin）</option>
                  </select>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={processing}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? '创建中...' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑用户</DialogTitle>
              <DialogDescription>
                修改用户信息和角色权限
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">姓名 *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-email">邮箱 *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-phone">电话</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入电话"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-role">角色 *</Label>
                  <select
                    id="edit-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    required
                  >
                    <option value="student">学生（Student）</option>
                    <option value="admin">管理员（Admin）</option>
                    <option value="teacher">教师（Teacher）</option>
                    <option value="agent">中介（Agent）</option>
                    <option value="superadmin">超级管理员（Superadmin）</option>
                  </select>
                  {editingUser && formData.role !== editingUser.role && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⚠️ 角色变更：{editingUser.role} → {formData.role}
                      <br />
                      • 用户需要重新登录才能生效
                      {editingUser.role === 'student' && formData.role !== 'student' && (
                        <><br />• 学生将升级为系统用户</>
                      )}
                      {editingUser.role !== 'student' && formData.role === 'student' && (
                        <><br />• 系统用户将降级为学生（无法登录）</>
                      )}
                      {editingUser.role === 'agent' && formData.role !== 'agent' && (
                        <><br />• 将删除 agents 集合记录</>
                      )}
                      {editingUser.role === 'teacher' && formData.role !== 'teacher' && (
                        <><br />• 将删除 teachers 集合记录</>
                      )}
                      {editingUser.role !== 'agent' && formData.role === 'agent' && (
                        <><br />• 将创建 agents 集合记录</>
                      )}
                      {editingUser.role !== 'teacher' && formData.role === 'teacher' && (
                        <><br />• 将创建 teachers 集合记录</>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', phone: '', role: 'admin' });
                  }}
                  disabled={processing}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? '更新中...' : '保存修改'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">权限说明</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>学生（Student）</strong>：无登录权限，仅用于档案管理</li>
                  <li><strong>管理员（Admin）</strong>：管理学生、课程、注册、财务</li>
                  <li><strong>教师（Teacher）</strong>：查看和管理自己的课程</li>
                  <li><strong>中介（Agent）</strong>：推荐学生、查看自己的学生</li>
                  <li><strong>超级管理员（Superadmin）</strong>：管理所有系统用户和权限</li>
                  <li>💡 <strong>角色转换</strong>：可以将学生升级为系统用户，或将系统用户降级为学生</li>
                  <li>⚠️ 修改角色后，用户需要重新登录才能生效</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

