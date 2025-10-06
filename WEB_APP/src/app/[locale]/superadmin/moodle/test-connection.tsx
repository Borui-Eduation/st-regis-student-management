/**
 * Moodle Connection Test Component
 * 用于测试和调试 Moodle 连接
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function MoodleConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      console.log('🧪 开始测试 Moodle 连接...');
      const res = await fetch('/api/admin/test-moodle');
      const data = await res.json();

      console.log('📊 测试结果:', data);
      setResult(data);
    } catch (error: any) {
      console.error('❌ 测试失败:', error);
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧪 Moodle 连接测试</span>
          <Button
            onClick={testConnection}
            disabled={testing}
            size="sm"
            variant="outline"
          >
            {testing ? '测试中...' : '测试连接'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success ? (
              <div>
                <h4 className="font-semibold text-green-800 mb-2">✅ 连接成功</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>站点名称:</strong> {result.data?.siteName}</p>
                  <p><strong>Moodle 版本:</strong> {result.data?.version}</p>
                  <p><strong>课程数量:</strong> {result.data?.coursesCount}</p>
                  <p><strong>配置 URL:</strong> {result.data?.config?.moodleUrl}</p>
                  <p><strong>Token 状态:</strong> {result.data?.config?.tokenConfigured ? '✓ 已配置' : '✗ 未配置'}</p>
                  
                  {result.data?.courses && result.data.courses.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium">示例课程:</p>
                      <ul className="list-disc pl-5 mt-1">
                        {result.data.courses.map((course: any) => (
                          <li key={course.id}>{course.fullname} ({course.shortname})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-red-800 mb-2">❌ 连接失败</h4>
                <div className="text-sm text-red-700">
                  <p>{result.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!result && !testing && (
          <p className="text-sm text-gray-600">
            点击"测试连接"按钮检查 Moodle 配置是否正确
          </p>
        )}
      </CardContent>
    </Card>
  );
}

