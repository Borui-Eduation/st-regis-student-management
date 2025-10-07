/**
 * 密码管理工具
 * 用于密码哈希和验证
 */

import bcrypt from 'bcryptjs';

/**
 * 默认密码
 */
export const DEFAULT_PASSWORD = 'StRegis2025!';

/**
 * 哈希密码
 * @param password 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hashedPassword 哈希密码
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 生成默认密码哈希值
 * @returns 默认密码的哈希值
 */
export async function getDefaultPasswordHash(): Promise<string> {
  return hashPassword(DEFAULT_PASSWORD);
}




