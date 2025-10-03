/**
 * Agent Detail Dialog
 * 中介详情对话框
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Agent, Student } from '@/types';

interface AgentDetailDialogProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function AgentDetailDialog({ agent, isOpen, onClose, onRefresh }: AgentDetailDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Agent>>({});

  // 加载该中介的学生
  useEffect(() => {
    if (agent && isOpen) {
      fetchAgentStudents();
      setFormData(agent);
    }
  }, [agent, isOpen]);

  const fetchAgentStudents = async () => {
    if (!agent) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/agents/${agent.agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent details');
      const data = await response.json();
      setStudents(data.data.students || []);
    } catch (error) {
      console.error('Error fetching agent students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!agent) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/agents/${agent.agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update agent');
      }

      alert('中介信息更新成功');
      setIsEditing(false);
      onRefresh();
    } catch (error: any) {
      console.error('Error updating agent:', error);
      alert(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{agent.name}</h2>
              <p className="text-sm text-gray-500 mt-1">中介详情</p>
            </div>
            <Badge
              variant={agent.status === 'active' ? 'default' : 'secondary'}
              className={
                agent.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {agent.status === 'active' ? '活跃' : '停用'}
            </Badge>
          </div>

          {/* Agent Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">基本信息</h3>
            
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">机构名称</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                  <input
                    type="text"
                    value={formData.contactName || ''}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">佣金比例</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.commissionRate || ''}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">联系人：</span>
                  <span className="font-medium ml-2">{agent.contactName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">邮箱：</span>
                  <span className="font-medium ml-2">{agent.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">电话：</span>
                  <span className="font-medium ml-2">{agent.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">地址：</span>
                  <span className="font-medium ml-2">{agent.address || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">佣金比例：</span>
                  <span className="font-medium ml-2">
                    {agent.commissionRate ? `${(agent.commissionRate * 100).toFixed(1)}%` : '-'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Students List */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              推荐学生 ({students.length})
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : students.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无推荐学生</p>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        学生姓名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        邮箱
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.studentId}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {student.email || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge
                            variant={student.status === 'active' ? 'default' : 'secondary'}
                            className={
                              student.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {student.status === 'active' ? '活跃' : '停用'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              关闭
            </Button>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(agent);
                  }}
                  className="flex-1"
                  disabled={loading}
                >
                  取消编辑
                </Button>
                <Button
                  onClick={handleUpdate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? '保存中...' : '保存'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                编辑信息
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

