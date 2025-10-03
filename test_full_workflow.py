#!/usr/bin/env python3
"""
完整业务流程测试脚本
模拟：学生选课 -> 管理员审批 -> IT开课
"""

import os
import json
import requests
import time
from google.cloud import firestore
from datetime import datetime

# API 基础URL
API_BASE = "http://localhost:3000"

# 初始化 Firestore
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './borui-education-4fd6c77422e0.json'
client = firestore.Client(project='borui-education', database='studentapp')

print("=" * 80)
print("🎯 St Regis 选课系统 - 完整流程测试")
print("=" * 80)
print()

# ============================================================================
# 步骤 1: 准备测试数据
# ============================================================================
print("📋 步骤 1/5: 准备测试数据")
print("-" * 80)

# 创建测试学生
test_student_id = "TEST_STUDENT_001"
test_student_data = {
    "studentId": test_student_id,
    "name": "张三",
    "email": "zhangsan@test.com",
    "phoneNumber": "13800138000",
    "parentName": "张父",
    "parentEmail": "parent@test.com",
    "parentPhone": "13900139000",
    "currentCourses": 0,
    "completedCourses": 0,
    "status": "active",
    "enrollmentDate": firestore.SERVER_TIMESTAMP,
    "createdAt": firestore.SERVER_TIMESTAMP,
    "updatedAt": firestore.SERVER_TIMESTAMP,
}

# 写入测试学生
client.collection('students').document(test_student_id).set(test_student_data)
print(f"✅ 创建测试学生: {test_student_data['name']} ({test_student_id})")
print(f"   邮箱: {test_student_data['email']}")
print()

# 获取前3门课程
courses_ref = client.collection('courses').where('status', '==', 'active').limit(3)
courses = list(courses_ref.stream())

if len(courses) == 0:
    print("❌ 错误: 没有可用的课程！")
    print("请先运行 import_data.py 导入课程数据")
    exit(1)

print(f"✅ 找到 {len(courses)} 门可选课程:")
cart_items = []
for i, course_doc in enumerate(courses, 1):
    course = course_doc.to_dict()
    print(f"   {i}. {course.get('courseName')} - 教师: {course.get('teacherName')} - ${course.get('price', 1200)}")
    cart_items.append({
        "courseId": course_doc.id,
        "courseName": course.get('courseName'),
        "teacherName": course.get('teacherName'),
        "price": course.get('price', 1200),
        "academicYear": course.get('academicYear', '2025-2026'),
        "semester": course.get('semester', 'Fall'),
    })
print()

time.sleep(2)

# ============================================================================
# 步骤 2: 学生提交选课申请
# ============================================================================
print("🎓 步骤 2/5: 学生提交选课申请")
print("-" * 80)

enroll_payload = {
    "userId": test_student_id,
    "cartItems": cart_items
}

print(f"📤 发送 POST 请求到: {API_BASE}/api/enroll/submit")
print(f"   学生ID: {test_student_id}")
print(f"   课程数量: {len(cart_items)}")

try:
    response = requests.post(
        f"{API_BASE}/api/enroll/submit",
        json=enroll_payload,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"\n📥 响应状态: {response.status_code}")
    print(f"响应内容: {response.text[:500]}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            enrollment_ids = data.get('data', {}).get('enrollmentIds', [])
            print(f"\n✅ 选课申请提交成功！")
            print(f"   注册ID数量: {len(enrollment_ids)}")
            for i, eid in enumerate(enrollment_ids, 1):
                print(f"   {i}. {eid}")
        else:
            print(f"❌ 提交失败: {data.get('error')}")
            exit(1)
    else:
        print(f"❌ HTTP 错误: {response.status_code}")
        print(f"   {response.text}")
        exit(1)
        
except Exception as e:
    print(f"❌ 请求失败: {str(e)}")
    exit(1)

print()
time.sleep(2)

# ============================================================================
# 步骤 3: 验证注册记录已创建
# ============================================================================
print("🔍 步骤 3/5: 验证注册记录")
print("-" * 80)

enrollments_ref = client.collection('enrollments').where('studentId', '==', test_student_id)
enrollments = list(enrollments_ref.stream())

print(f"✅ 找到 {len(enrollments)} 条注册记录")
for enrollment_doc in enrollments:
    enrollment = enrollment_doc.to_dict()
    print(f"   - ID: {enrollment_doc.id}")
    print(f"     课程: {enrollment.get('courseName')}")
    print(f"     状态: {enrollment.get('status')}")
    print(f"     创建时间: {enrollment.get('createdAt')}")
print()

time.sleep(2)

# ============================================================================
# 步骤 4: 管理员审批
# ============================================================================
print("👨‍💼 步骤 4/5: 管理员审批")
print("-" * 80)

for i, enrollment_doc in enumerate(enrollments, 1):
    enrollment_id = enrollment_doc.id
    enrollment = enrollment_doc.to_dict()
    course_name = enrollment.get('courseName', 'Unknown')
    
    if enrollment.get('status') != 'pending':
        print(f"⏭️  跳过 {course_name} (状态: {enrollment.get('status')})")
        continue
    
    print(f"\n审批 {i}/{len(enrollments)}: {course_name}")
    
    approve_payload = {
        "enrollmentId": enrollment_id,
        "adminEmail": "admin@stregis.edu",
        "comments": "测试审批 - 已确认支付"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/api/admin/approve",
            json=approve_payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"   ✅ 批准成功！")
            else:
                print(f"   ❌ 批准失败: {data.get('error')}")
        else:
            print(f"   ❌ HTTP 错误: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ 请求失败: {str(e)}")
    
    time.sleep(1)

print()
time.sleep(2)

# ============================================================================
# 步骤 5: IT 开课
# ============================================================================
print("💻 步骤 5/5: IT 开课")
print("-" * 80)

# 重新获取注册记录（状态已更新）
enrollments = list(enrollments_ref.stream())

for i, enrollment_doc in enumerate(enrollments, 1):
    enrollment_id = enrollment_doc.id
    enrollment = enrollment_doc.to_dict()
    course_name = enrollment.get('courseName', 'Unknown')
    status = enrollment.get('status')
    
    if status != 'ready':
        print(f"⏭️  跳过 {course_name} (状态: {status})")
        continue
    
    print(f"\n开课 {i}/{len(enrollments)}: {course_name}")
    
    open_payload = {
        "enrollmentId": enrollment_id,
        "itEmail": "it@stregis.edu",
        "moodleCourseId": f"COURSE_{i}",
        "moodleEnrollmentUrl": f"https://moodle.stregis.edu/course/view.php?id={i}",
        "comments": "测试开课 - Moodle 课程已创建"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/api/it/open-course",
            json=open_payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"   ✅ 开课成功！")
            else:
                print(f"   ❌ 开课失败: {data.get('error')}")
        else:
            print(f"   ❌ HTTP 错误: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ 请求失败: {str(e)}")
    
    time.sleep(1)

print()
time.sleep(1)

# ============================================================================
# 最终验证
# ============================================================================
print("=" * 80)
print("📊 测试结果汇总")
print("=" * 80)

# 统计各状态的注册数
enrollments = list(enrollments_ref.stream())
status_counts = {}
for enrollment_doc in enrollments:
    status = enrollment_doc.to_dict().get('status', 'unknown')
    status_counts[status] = status_counts.get(status, 0) + 1

print(f"\n学生: {test_student_data['name']} ({test_student_id})")
print(f"总注册数: {len(enrollments)}")
print(f"\n状态分布:")
for status, count in status_counts.items():
    emoji = {
        'pending': '⏳',
        'ready': '✅',
        'open': '🎉',
        'rejected': '❌'
    }.get(status, '❓')
    print(f"  {emoji} {status}: {count}")

print("\n" + "=" * 80)
print("🎉 测试完成！")
print("=" * 80)
print("\n💡 提示:")
print(f"   - 访问管理员页面: {API_BASE}/admin")
print(f"   - 访问IT页面: {API_BASE}/it")
print(f"   - 查看完整流程结果")
print()

