/**
 * Root Layout (No i18n here)
 * 根布局（不包含国际化，仅基础HTML结构）
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'St Regis 选课系统 | St Regis Enrollment System',
  description: '支持高并发的在线选课平台 | High-performance online course enrollment platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}