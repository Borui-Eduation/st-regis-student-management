import { NextRequest, NextResponse } from 'next/server';
import { collections } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { exists: false, message: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查用户是否存在于 students collection
    const usersSnapshot = await collections.students
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    const exists = !usersSnapshot.empty;

    return NextResponse.json({ 
      exists,
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { exists: false, message: '检查邮箱时出错' },
      { status: 500 }
    );
  }
}



