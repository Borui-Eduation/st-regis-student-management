import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/layout/nav-bar';
import { AuthProvider } from '@/components/providers/auth-provider';

export const metadata: Metadata = {
  title: 'St Regis 选课系统',
  description: '支持高并发的在线选课平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">
        <AuthProvider>
          <NavBar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
