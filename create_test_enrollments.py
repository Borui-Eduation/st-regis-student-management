#!/usr/bin/env python3
"""
创建测试注册数据
为前几个学生创建课程注册记录，包含不同的状态
"""

import os
import sys
import random
from google.cloud import firestore

# 设置认证
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './borui-education-4fd6c77422e0.json'

# 初始化 Firestore
client = firestore.Client(project='borui-education', database='studentapp')

def create_test_enrollments():
    """为前10个学生创建测试注册数据"""
    
    print("=" * 80)
    print("🎯 创建测试注册数据")
    print("=" * 80)
    
    # 获取前10个学生
    students = list(client.collection('students').limit(10).stream())
    # 获取所有课程
    courses = list(client.collection('courses').stream())
    
    if not students:
        print("❌ 错误：没有找到学生数据")
        return
    
    if not courses:
        print("❌ 错误：没有找到课程数据")
        return
    
    print(f"\n✅ 找到 {len(students)} 个学生")
    print(f"✅ 找到 {len(courses)} 门课程")
    
    # 状态列表
    statuses = ['pending', 'ready', 'open', 'rejected']
    
    enrollments_ref = client.collection('enrollments')
    created_count = 0
    
    print("\n📝 创建注册记录...")
    
    for student_doc in students:
        student = student_doc.to_dict()
        student_id = student_doc.id
        student_name = student.get('name', 'Unknown')
        
        # 为每个学生随机选择2-4门课程
        num_courses = random.randint(2, 4)
        selected_courses = random.sample(courses, num_courses)
        
        print(f"\n👤 {student_name}:")
        
        for course_doc in selected_courses:
            course = course_doc.to_dict()
            course_id = course_doc.id
            course_name = course.get('courseName', 'Unknown')
            teacher_name = course.get('teacherName', 'Unknown')
            
            # 随机选择状态（主要是 open，少量其他状态）
            weights = [0.1, 0.1, 0.75, 0.05]  # pending, ready, open, rejected
            status = random.choices(statuses, weights=weights)[0]
            
            enrollment_data = {
                'studentId': student_id,
                'studentName': student_name,
                'studentEmail': student.get('email', ''),
                
                'courseId': course_id,
                'courseName': course_name,
                'teacherName': teacher_name,
                
                'academicYear': course.get('academicYear', '2025-2026'),
                'semester': course.get('semester', 'Fall'),
                'startDate': '2025-09-01',
                'endDate': '2026-01-20',
                
                'status': status,
                
                'approvalHistory': [{
                    'status': status,
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'actor': 'system',
                    'comments': '测试数据'
                }],
                
                'payment': {
                    'paid': status != 'rejected',
                    'paidAt': firestore.SERVER_TIMESTAMP if status != 'rejected' else None,
                    'amount': 1200,
                    'method': 'manual'
                },
                
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }
            
            # 写入数据库
            doc_ref = enrollments_ref.document()
            doc_ref.set(enrollment_data)
            
            # 状态图标
            status_icon = {
                'pending': '⏳',
                'ready': '✅',
                'open': '🎉',
                'rejected': '❌'
            }.get(status, '❓')
            
            print(f"   {status_icon} {course_name} ({teacher_name}) - {status}")
            created_count += 1
    
    print(f"\n" + "=" * 80)
    print(f"✅ 成功创建 {created_count} 条注册记录")
    print("=" * 80)
    
    # 显示统计
    print(f"\n📊 状态分布:")
    for status in statuses:
        count = len(list(enrollments_ref.where('status', '==', status).stream()))
        status_name = {
            'pending': '待审批',
            'ready': '待开课',
            'open': '已开课',
            'rejected': '已拒绝'
        }.get(status, status)
        print(f"   {status_name}: {count} 条")

if __name__ == '__main__':
    try:
        create_test_enrollments()
        print("\n✅ 完成！现在刷新管理员页面查看效果")
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)

