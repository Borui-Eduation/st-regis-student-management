'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Course {
  courseId: string;
  courseName: string;
  subject: string;
  teacherName: string;
  academicYear: string;
  semester: string;
  currentEnrollment: number;
  maxEnrollment?: number;
  minEnrollment?: number;
  price: number;
  status?: string;
  gradeLevel?: number;
}

export default function StudentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [cart, setCart] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setCourses(data.data.items);
      } else {
        throw new Error(data.error || 'Failed to fetch courses');
      }
    } catch (error) {
      // Error handling - could integrate with toast/notification system
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (course: Course) => {
    if (!cart.find(c => c.courseId === course.courseId)) {
      setCart([...cart, course]);
    }
  };

  const removeFromCart = (courseId: string) => {
    setCart(cart.filter(c => c.courseId !== courseId));
  };

  // 判断课程是否可报名
  const getCourseAvailability = (course: Course) => {
    // 检查课程状态
    if (course.status && course.status !== 'active') {
      return {
        available: false,
        status: 'closed',
        label: '已关闭',
        color: 'text-gray-500 bg-gray-100',
      };
    }

    // 检查人数上限
    if (course.maxEnrollment && course.currentEnrollment >= course.maxEnrollment) {
      return {
        available: false,
        status: 'full',
        label: '已满',
        color: 'text-red-600 bg-red-50',
      };
    }

    // 检查是否已在购物车
    if (cart.some(c => c.courseId === course.courseId)) {
      return {
        available: true,
        status: 'in-cart',
        label: '已在购物车',
        color: 'text-blue-600 bg-blue-50',
      };
    }

    // 可报名
    return {
      available: true,
      status: 'available',
      label: '可报名',
      color: 'text-green-600 bg-green-50',
    };
  };

  const submitEnrollment = async () => {
    if (cart.length === 0) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/enroll/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-student-001',
          cartItems: cart.map(c => ({
            courseId: c.courseId,
            courseName: c.courseName,
            teacherName: c.teacherName,
            price: c.price,
            academicYear: c.academicYear,
            semester: c.semester,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ 注册成功！已提交 ${cart.length} 门课程\n\n注册ID: ${data.data.enrollmentIds.join(', ')}`);
        setCart([]);
      } else {
        alert('❌ 注册失败: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ 提交失败: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = cart.reduce((sum, c) => sum + c.price, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full mx-auto px-6 py-4 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎓 学生选课系统</h1>
              <p className="text-sm text-gray-500 mt-1">浏览课程并添加到购物车</p>
            </div>
            <div className="flex gap-4">
              <a href="/" className="text-blue-600 hover:text-blue-700">返回首页</a>
              <a href="/admin" className="text-blue-600 hover:text-blue-700">管理员</a>
              <a href="/it" className="text-blue-600 hover:text-blue-700">IT</a>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-6 py-8 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Courses List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">📚 可选课程</h2>
                <p className="text-sm text-gray-500 mt-1">共 {courses.length} 门课程</p>
              </div>
            
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">加载中...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无课程</p>
                  <p className="text-sm text-gray-400 mt-2">请先使用 Python 脚本导入数据</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          课程名称
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学科
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          教师
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          年级
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          名额
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          价格
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courses.map((course) => {
                        const availability = getCourseAvailability(course);
                        const isInCart = cart.some(c => c.courseId === course.courseId);
                        const isFull = course.maxEnrollment && course.currentEnrollment >= course.maxEnrollment;
                        
                        return (
                          <tr 
                            key={course.courseId} 
                            className={`hover:bg-gray-50 transition-colors ${isInCart ? 'bg-blue-50/30' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {course.courseName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {course.academicYear} | {course.semester}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {course.subject}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {course.teacherName || '待定'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {course.gradeLevel ? `${course.gradeLevel}年级` : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm">
                                <span className={`font-medium ${isFull ? 'text-red-600' : 'text-gray-900'}`}>
                                  {course.currentEnrollment}
                                </span>
                                <span className="text-gray-400 mx-1">/</span>
                                <span className="text-gray-600">
                                  {course.maxEnrollment || '∞'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${availability.color}`}>
                                {availability.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-semibold text-green-600">
                                ${course.price}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isInCart ? (
                                <button
                                  onClick={() => removeFromCart(course.courseId)}
                                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  ✓ 已添加
                                </button>
                              ) : (
                                <button
                                  onClick={() => addToCart(course)}
                                  disabled={!availability.available || availability.status === 'full'}
                                  className={`text-xs px-3 py-1.5 rounded transition-colors ${
                                    availability.available && availability.status !== 'full'
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  + 添加
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Shopping Cart */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle>🛒 购物车</CardTitle>
                  <CardDescription>{cart.length} 门课程</CardDescription>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">购物车为空</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((course) => (
                        <div key={course.courseId} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{course.courseName}</p>
                            <p className="text-xs text-gray-500 mt-1">{course.subject}</p>
                            <p className="text-sm text-green-600 mt-1">${course.price}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(course.courseId)}
                            className="text-red-500 hover:text-red-700 text-sm ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex-col space-y-3">
                  <div className="w-full flex justify-between items-center text-lg font-semibold">
                    <span>总计:</span>
                    <span className="text-green-600">${totalPrice}</span>
                  </div>
                  <Button
                    onClick={submitEnrollment}
                    disabled={cart.length === 0 || submitting}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? '提交中...' : `🚀 提交注册 (${cart.length})`}
                  </Button>
                  {cart.length > 0 && (
                    <p className="text-xs text-gray-500 text-center">
                      提交后状态为 pending，等待管理员审批
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

