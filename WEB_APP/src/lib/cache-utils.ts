/**
 * 缓存工具函数
 * 统一管理缓存失效逻辑，避免重复代码
 */

import { invalidateTieredCacheByPrefix } from './cache-tiered';

/**
 * 失效学生相关缓存
 */
export async function invalidateStudentsCaches(): Promise<void> {
  await Promise.all([
    invalidateTieredCacheByPrefix('students:'),
    invalidateTieredCacheByPrefix('student:'),
    invalidateTieredCacheByPrefix('admin:stats'),
  ]);
}

/**
 * 失效注册相关缓存
 */
export async function invalidateEnrollmentsCaches(): Promise<void> {
  await Promise.all([
    invalidateTieredCacheByPrefix('enrollments:'),
    invalidateTieredCacheByPrefix('enrollment:'),
    invalidateTieredCacheByPrefix('admin:stats'),
  ]);
}

/**
 * 失效财务相关缓存
 */
export async function invalidateFinanceCaches(): Promise<void> {
  await Promise.all([
    invalidateTieredCacheByPrefix('finance:'),
    invalidateTieredCacheByPrefix('admin:stats'),
  ]);
}

/**
 * 失效中介相关缓存
 */
export async function invalidateAgentsCaches(): Promise<void> {
  await Promise.all([
    invalidateTieredCacheByPrefix('agents:'),
    invalidateTieredCacheByPrefix('agent:'),
  ]);
}

/**
 * 失效所有管理相关缓存
 * 适用于：影响多个模块的操作
 */
export async function invalidateAllAdminCaches(): Promise<void> {
  await Promise.all([
    invalidateTieredCacheByPrefix('students:'),
    invalidateTieredCacheByPrefix('student:'),
    invalidateTieredCacheByPrefix('enrollments:'),
    invalidateTieredCacheByPrefix('enrollment:'),
    invalidateTieredCacheByPrefix('finance:'),
    invalidateTieredCacheByPrefix('agents:'),
    invalidateTieredCacheByPrefix('agent:'),
    invalidateTieredCacheByPrefix('admin:'),
  ]);
}

