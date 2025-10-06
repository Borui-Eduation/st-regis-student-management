/**
 * Agent Management Page
 * 中介管理页面 - 供管理员管理中介账号
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Agent } from '@/types';
import { CreateAgentDialog } from './components/CreateAgentDialog';
import { AgentDetailDialog } from './components/AgentDetailDialog';

export default function AgentsPage() {
  const t = useTranslations('pages.agents');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 加载中介列表
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data.data.items || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      alert(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // 过滤中介
  const filteredAgents = agents.filter(agent =>
    agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone?.includes(searchTerm)
  );

  // 删除中介
  const handleDelete = async (agentId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete agent');
      }

      alert(t('deleteSuccess'));
      fetchAgents();
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      alert(error.message || t('errors.deleteFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={fetchAgents}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                🔄 {tCommon('refresh')}
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                ➕ {t('createAgent')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('listTitle')}</CardTitle>
            <CardDescription>
              {tCommon('total', { count: filteredAgents.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{tCommon('loading')}</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('noAgents')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tCommon('name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('table.contact')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('table.contactInfo')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('table.commission')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tCommon('status')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tCommon('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAgents.map((agent) => (
                      <tr key={agent.agentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {agent.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {agent.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.contactName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{agent.phone || '-'}</div>
                          <div className="text-xs text-gray-400">{agent.address || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.commissionRate ? `${(agent.commissionRate * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant="default"
                            className={
                              agent.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {agent.status === 'active' ? tStatus('active') : tStatus('inactive')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsDialogOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            {tCommon('view')}
                          </button>
                          <button
                            onClick={() => handleDelete(agent.agentId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {tCommon('delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

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
              <h3 className="text-sm font-medium text-blue-800">{t('info.title')}</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  {(t.raw('info.items') as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Create Agent Dialog */}
        <CreateAgentDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={fetchAgents}
        />

        {/* Agent Detail Dialog */}
        <AgentDetailDialog
          agent={selectedAgent}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onRefresh={fetchAgents}
        />
      </div>
    </div>
  );
}

