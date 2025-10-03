#!/usr/bin/env python3
"""
教师数据导入脚本
从Excel导入教师信息（如果有的话），或者手动创建教师记录

使用方法:
python scripts/import_teachers.py [--excel <file>]
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from google.cloud import firestore
from google.oauth2 import service_account
import pandas as pd

# Firebase配置
SERVICE_ACCOUNT_FILE = 'borui-education-4fd6c77422e0.json'

def init_firestore():
    """初始化Firestore客户端"""
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE
    )
    # 使用命名数据库 'studentapp'
    return firestore.Client(credentials=credentials, database='studentapp')

def import_teachers_from_courses(dry_run=False):
    """
    从现有课程中提取教师信息
    自动去重并创建teacher记录
    """
    db = init_firestore()
    
    print("=" * 60)
    print("从课程数据提取教师信息")
    print("=" * 60)
    
    # 获取所有课程
    courses = db.collection('courses').stream()
    
    teacher_names = set()
    for course in courses:
        course_data = course.to_dict()
        teacher_name = course_data.get('teacherName')
        if teacher_name:
            teacher_names.add(teacher_name.strip())
    
    print(f"\n找到 {len(teacher_names)} 位不同的教师")
    
    # 检查是否自动确认
    auto_confirm = '--yes' in sys.argv or '-y' in sys.argv
    
    if dry_run:
        print("\n🔍 DRY RUN 模式 - 教师列表:")
        for idx, name in enumerate(sorted(teacher_names), 1):
            print(f"  {idx}. {name}")
        return
    
    if not auto_confirm:
        confirm = input("\n确认导入这些教师? (yes/no): ")
        if confirm.lower() != 'yes':
            print("取消操作")
            return
    else:
        print("\n✅ 自动确认 - 开始导入")
    
    # 创建教师记录
    teachers_ref = db.collection('teachers')
    created_count = 0
    skipped_count = 0
    
    for teacher_name in sorted(teacher_names):
        # 检查是否已存在
        existing = teachers_ref.where('name', '==', teacher_name).limit(1).get()
        
        if len(list(existing)) > 0:
            print(f"  ℹ️  跳过 {teacher_name} - 已存在")
            skipped_count += 1
            continue
        
        # 创建教师记录
        teacher_data = {
            'name': teacher_name,
            'email': f"{teacher_name.lower().replace(' ', '.').replace(',', '')}@borui.org",
            'phone': None,
            'department': None,
            'specialization': [],
            'bio': None,
            'status': 'active',
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        }
        
        teacher_ref = teachers_ref.document()
        teacher_ref.set(teacher_data)
        
        print(f"  ✅ 创建教师: {teacher_name} (ID: {teacher_ref.id})")
        created_count += 1
    
    print("\n" + "=" * 60)
    print(f"完成! 创建: {created_count}, 跳过: {skipped_count}")
    print("=" * 60)

def update_courses_with_teacher_ids():
    """
    第二步：更新课程中的teacherId字段
    根据teacherName匹配并填充teacherId
    """
    db = init_firestore()
    
    print("\n" + "=" * 60)
    print("更新课程的teacherId字段")
    print("=" * 60)
    
    # 先获取所有教师，建立 name -> id 映射
    teachers = db.collection('teachers').stream()
    teacher_map = {}
    for teacher in teachers:
        teacher_data = teacher.to_dict()
        teacher_map[teacher_data['name']] = teacher.id
    
    print(f"\n教师映射表建立完成，共 {len(teacher_map)} 位教师")
    
    # 更新课程
    courses_ref = db.collection('courses')
    courses = courses_ref.stream()
    
    updated_count = 0
    not_found_count = 0
    
    for course_doc in courses:
        course_data = course_doc.to_dict()
        teacher_name = course_data.get('teacherName')
        
        if not teacher_name:
            continue
        
        teacher_id = teacher_map.get(teacher_name.strip())
        
        if teacher_id:
            courses_ref.document(course_doc.id).update({
                'teacherId': teacher_id,
                'updatedAt': firestore.SERVER_TIMESTAMP,
            })
            print(f"  ✅ 更新课程 {course_data.get('courseName')}: teacherId = {teacher_id}")
            updated_count += 1
        else:
            print(f"  ⚠️  未找到教师 '{teacher_name}'")
            not_found_count += 1
    
    print("\n" + "=" * 60)
    print(f"完成! 更新: {updated_count}, 未找到: {not_found_count}")
    print("=" * 60)

if __name__ == '__main__':
    dry_run = '--dry-run' in sys.argv
    auto_confirm = '--yes' in sys.argv or '-y' in sys.argv
    
    try:
        # 步骤1: 从课程提取教师
        import_teachers_from_courses(dry_run=dry_run)
        
        if not dry_run:
            # 步骤2: 更新课程的teacherId
            if not auto_confirm:
                proceed = input("\n是否继续更新课程的teacherId字段? (yes/no): ")
                if proceed.lower() == 'yes':
                    update_courses_with_teacher_ids()
                else:
                    print("跳过teacherId更新")
            else:
                print("\n✅ 自动继续更新课程teacherId")
                update_courses_with_teacher_ids()
    
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

