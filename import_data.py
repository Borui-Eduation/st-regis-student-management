#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据导入脚本
从 Excel 导入学生课程数据到 Firestore
使用方案 B：3个集合（students, courses, enrollments）
"""

import pandas as pd
from google.cloud import firestore
from datetime import datetime
import os
import sys
from collections import defaultdict

# 设置认证
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'borui-education-4fd6c77422e0.json'

# 连接到 Firestore
db = firestore.Client(project='borui-education', database='studentapp')

def clean_string(value):
    """清理字符串数据"""
    if pd.isna(value):
        return None
    return str(value).strip().replace('\n', ' ')

def clean_email(email):
    """清理和标准化邮箱"""
    if pd.isna(email):
        return None
    email = str(email).strip().lower()
    # 移除多余的换行符
    email = email.replace('\n', '').replace(' ', '')
    return email if '@' in email else None

def parse_grade_level(course_name):
    """从课程名称中提取年级"""
    if pd.isna(course_name):
        return None
    import re
    match = re.search(r'\b(\d{1,2})\b', str(course_name))
    if match:
        return int(match.group(1))
    return None

def import_students(df):
    """
    导入学生数据
    去重并创建学生记录
    """
    print("\n" + "=" * 80)
    print("📚 步骤 1: 导入学生数据")
    print("=" * 80)
    
    # 收集所有唯一学生
    students_dict = {}
    
    for _, row in df.iterrows():
        name = clean_string(row['Name'])
        email = clean_email(row['Email'])
        
        if not name or name == 'nan':
            continue
        
        # 使用名字作为唯一标识（如果有邮箱，优先用邮箱）
        key = email if email else name
        
        if key not in students_dict:
            students_dict[key] = {
                'name': name,
                'email': email,
                'school': clean_string(row.get('Unnamed: 3', 'St. Regis')),
                'status': 'active',
                'currentCourses': 0,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }
    
    print(f"\n发现 {len(students_dict)} 个唯一学生")
    
    # 导入到 Firestore
    students_ref = db.collection('students')
    student_id_map = {}  # 映射：name -> studentId
    
    batch = db.batch()
    batch_count = 0
    
    for i, (key, student_data) in enumerate(students_dict.items(), 1):
        doc_ref = students_ref.document()
        batch.set(doc_ref, student_data)
        student_id_map[student_data['name']] = doc_ref.id
        
        batch_count += 1
        
        print(f"  {i}. {student_data['name']:<30} {student_data['email'] or '无邮箱'}")
        
        # 每500条提交一次
        if batch_count >= 500:
            batch.commit()
            batch = db.batch()
            batch_count = 0
    
    # 提交剩余的
    if batch_count > 0:
        batch.commit()
    
    print(f"\n✓ 成功导入 {len(students_dict)} 个学生")
    return student_id_map

def import_courses(df):
    """
    导入课程数据
    去重并创建课程记录
    """
    print("\n" + "=" * 80)
    print("📖 步骤 2: 导入课程数据")
    print("=" * 80)
    
    # 收集所有唯一课程
    courses_dict = {}
    
    for _, row in df.iterrows():
        course_name = clean_string(row['Course'])
        teacher_name = clean_string(row['Teacher'])
        
        if not course_name or course_name == 'nan':
            continue
        
        # 使用课程名称作为唯一标识
        key = course_name
        
        if key not in courses_dict:
            grade_level = parse_grade_level(course_name)
            
            courses_dict[key] = {
                'courseName': course_name,
                'subject': extract_subject(course_name),
                'gradeLevel': grade_level,
                'teacherName': teacher_name,
                'academicYear': '2025-2026',
                'semester': 'Fall',  # 默认秋季学期
                'currentEnrollment': 0,
                'status': 'active',
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }
    
    print(f"\n发现 {len(courses_dict)} 门唯一课程")
    
    # 导入到 Firestore
    courses_ref = db.collection('courses')
    course_id_map = {}  # 映射：courseName -> courseId
    
    batch = db.batch()
    batch_count = 0
    
    for i, (key, course_data) in enumerate(courses_dict.items(), 1):
        doc_ref = courses_ref.document()
        batch.set(doc_ref, course_data)
        course_id_map[course_data['courseName']] = doc_ref.id
        
        batch_count += 1
        
        teacher = course_data['teacherName'] or '待分配'
        print(f"  {i}. {course_data['courseName']:<35} | {teacher}")
        
        if batch_count >= 500:
            batch.commit()
            batch = db.batch()
            batch_count = 0
    
    if batch_count > 0:
        batch.commit()
    
    print(f"\n✓ 成功导入 {len(courses_dict)} 门课程")
    return course_id_map

def extract_subject(course_name):
    """从课程名称中提取学科"""
    if not course_name:
        return 'Other'
    
    course_lower = course_name.lower()
    
    subjects = {
        'Mathematics': ['math', 'calculus', 'algebra', 'precal', 'pre-cal'],
        'Physics': ['physics'],
        'Chemistry': ['chemistry', 'chem'],
        'Biology': ['biology', 'life science'],
        'English': ['english', 'literary', 'composition'],
        'French': ['french'],
        'Mandarin': ['mandarin', 'chinese'],
        'Social Studies': ['social studies', 'history'],
        'Economics': ['econ'],
        'Science': ['science']
    }
    
    for subject, keywords in subjects.items():
        if any(keyword in course_lower for keyword in keywords):
            return subject
    
    return 'Other'

def import_enrollments(df, student_id_map, course_id_map):
    """
    导入注册记录
    创建学生-课程关联
    """
    print("\n" + "=" * 80)
    print("📝 步骤 3: 导入注册记录")
    print("=" * 80)
    
    enrollments_ref = db.collection('enrollments')
    
    batch = db.batch()
    batch_count = 0
    success_count = 0
    skipped_count = 0
    
    # 统计每个学生和课程的注册数
    student_course_count = defaultdict(int)
    course_enrollment_count = defaultdict(int)
    
    for i, row in df.iterrows():
        student_name = clean_string(row['Name'])
        course_name = clean_string(row['Course'])
        
        if not student_name or not course_name:
            skipped_count += 1
            continue
        
        student_id = student_id_map.get(student_name)
        course_id = course_id_map.get(course_name)
        
        if not student_id or not course_id:
            print(f"  ⚠️  跳过: {student_name} - {course_name} (找不到ID)")
            skipped_count += 1
            continue
        
        # 解析期中成绩
        midterm_mark = row.get('Midterm \nMark')
        if pd.notna(midterm_mark):
            midterm_str = str(midterm_mark).strip()
        else:
            midterm_str = 'Opened'
        
        # 解析结束时间
        end_time = clean_string(row.get('End Time', 'Jan 20th, 2026'))
        
        # 创建注册记录
        enrollment_data = {
            # 关联 ID
            'studentId': student_id,
            'studentName': student_name,  # 冗余，方便查询
            'studentEmail': clean_email(row.get('Email')),
            
            'courseId': course_id,
            'courseName': course_name,  # 冗余
            
            'teacherName': clean_string(row.get('Teacher')),
            
            # 学期信息
            'academicYear': '2025-2026',
            'semester': 'Fall',
            'startDate': '2025-09-01',
            'endDate': end_time or 'Jan 20th, 2026',
            
            # 成绩信息
            'midtermMark': midterm_str,
            'midtermComments': clean_string(row.get('Midterm Comments', '')),
            'finalGrade': None,
            'finalComments': clean_string(row.get('Final  Comments', '')),
            
            # 状态信息
            'status': 'active',
            'myEdBCStatus': clean_string(row.get('MyEdBC', '')),
            'paid': False,  # 默认未支付
            'paidDate': None,
            
            # 元数据
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = enrollments_ref.document()
        batch.set(doc_ref, enrollment_data)
        batch_count += 1
        success_count += 1
        
        # 统计
        student_course_count[student_name] += 1
        course_enrollment_count[course_name] += 1
        
        print(f"  {success_count}. {student_name:<30} → {course_name}")
        
        if batch_count >= 500:
            batch.commit()
            batch = db.batch()
            batch_count = 0
    
    if batch_count > 0:
        batch.commit()
    
    print(f"\n✓ 成功导入 {success_count} 条注册记录")
    if skipped_count > 0:
        print(f"⚠️  跳过 {skipped_count} 条无效记录")
    
    # 更新学生和课程的统计信息
    print("\n📊 更新统计信息...")
    update_statistics(student_id_map, course_id_map, 
                     student_course_count, course_enrollment_count)
    
    return success_count

def update_statistics(student_id_map, course_id_map, 
                     student_course_count, course_enrollment_count):
    """更新学生和课程的统计信息"""
    batch = db.batch()
    
    # 更新学生的课程数
    for student_name, count in student_course_count.items():
        student_id = student_id_map.get(student_name)
        if student_id:
            student_ref = db.collection('students').document(student_id)
            batch.update(student_ref, {'currentCourses': count})
    
    # 更新课程的注册人数
    for course_name, count in course_enrollment_count.items():
        course_id = course_id_map.get(course_name)
        if course_id:
            course_ref = db.collection('courses').document(course_id)
            batch.update(course_ref, {'currentEnrollment': count})
    
    batch.commit()
    print("✓ 统计信息更新完成")

def print_summary():
    """打印导入摘要"""
    print("\n" + "=" * 80)
    print("📊 数据导入摘要")
    print("=" * 80)
    
    students_count = len(list(db.collection('students').limit(100).stream()))
    courses_count = len(list(db.collection('courses').limit(100).stream()))
    enrollments_count = len(list(db.collection('enrollments').limit(100).stream()))
    
    print(f"\n集合统计:")
    print(f"  📚 Students:     {students_count} 个学生")
    print(f"  📖 Courses:      {courses_count} 门课程")
    print(f"  📝 Enrollments:  {enrollments_count} 条注册记录")
    
    # 显示选修最多课程的学生
    print(f"\n选修最多课程的学生:")
    students = db.collection('students')\
        .order_by('currentCourses', direction=firestore.Query.DESCENDING)\
        .limit(5).stream()
    
    for student in students:
        data = student.to_dict()
        print(f"  - {data['name']:<30} {data['currentCourses']} 门课程")
    
    # 显示注册人数最多的课程
    print(f"\n注册人数最多的课程:")
    courses = db.collection('courses')\
        .order_by('currentEnrollment', direction=firestore.Query.DESCENDING)\
        .limit(5).stream()
    
    for course in courses:
        data = course.to_dict()
        teacher = data.get('teacherName', '未分配')
        print(f"  - {data['courseName']:<35} {data['currentEnrollment']} 人 | {teacher}")

def main():
    """主函数"""
    print("\n" + "=" * 80)
    print("🔥 St Regis 学生课程数据导入系统")
    print("=" * 80)
    print(f"\n项目: borui-education")
    print(f"数据库: studentapp")
    print(f"学年: 2025-2026")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 读取 Excel
    print("\n📂 读取 Excel 文件...")
    try:
        df = pd.read_excel("St Regis Online Courses Form.xlsx", sheet_name="2025-2026")
        print(f"✓ 成功读取 {len(df)} 条记录")
    except Exception as e:
        print(f"✗ 读取失败: {e}")
        sys.exit(1)
    
    # 确认导入
    print("\n" + "⚠️  " * 20)
    print("警告: 此操作将向 Firestore 写入数据")
    print("=" * 80)
    response = input("\n是否继续？(yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("\n❌ 操作已取消")
        sys.exit(0)
    
    try:
        # 执行导入
        student_id_map = import_students(df)
        course_id_map = import_courses(df)
        import_enrollments(df, student_id_map, course_id_map)
        
        # 显示摘要
        print_summary()
        
        print("\n" + "=" * 80)
        print("✅ 数据导入完成！")
        print("=" * 80)
        print("\n下一步:")
        print("  1. 在 Firebase Console 查看数据")
        print("  2. 运行查询示例: python query_examples.py")
        print("  3. 使用管理脚本: python student_manager.py")
        print()
        
    except Exception as e:
        print(f"\n✗ 导入失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

