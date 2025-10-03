#!/usr/bin/env python3
"""
为现有学生添加Agent相关字段
为students集合添加: schoolType, agentId, agentName

使用方法:
python scripts/add_student_agent_fields.py [--dry-run]
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from google.cloud import firestore
from google.oauth2 import service_account

# Firebase配置
SERVICE_ACCOUNT_FILE = 'borui-education-4fd6c77422e0.json'

def init_firestore():
    """初始化Firestore客户端"""
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE
    )
    # 使用命名数据库 'studentapp'
    return firestore.Client(credentials=credentials, database='studentapp')

def add_agent_fields(dry_run=False, auto_confirm=False):
    """
    为所有现有学生添加Agent相关字段
    
    新字段:
    - schoolType: 'stregis' | 'outside' (默认 'stregis')
    - agentId: string | null (默认 null)
    - agentName: string | null (默认 null)
    """
    db = init_firestore()
    
    print("=" * 60)
    print("为学生添加Agent字段")
    print("=" * 60)
    
    if dry_run:
        print("🔍 DRY RUN 模式 - 不会实际修改数据库")
    else:
        print("⚠️  LIVE 模式 - 将会修改数据库")
        if not auto_confirm:
            confirm = input("确认继续? (yes/no): ")
            if confirm.lower() != 'yes':
                print("取消操作")
                return
        else:
            print("✅ 自动确认模式 - 开始执行")
    
    print("\n步骤1: 读取所有学生...")
    students_ref = db.collection('students')
    students = students_ref.stream()
    
    total_count = 0
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for student_doc in students:
        total_count += 1
        student_data = student_doc.to_dict()
        student_id = student_doc.id
        
        # 检查是否已经有这些字段
        has_school_type = 'schoolType' in student_data
        has_agent_id = 'agentId' in student_data
        has_agent_name = 'agentName' in student_data
        
        if has_school_type and has_agent_id and has_agent_name:
            print(f"  ℹ️  跳过 {student_data.get('name', 'Unknown')} ({student_id}) - 字段已存在")
            skipped_count += 1
            continue
        
        try:
            # 准备更新数据
            update_data = {}
            
            if not has_school_type:
                # 默认为本校学生
                # 如果学校不是 St. Regis，则标记为外校
                school = student_data.get('school', 'St. Regis')
                if school and 'St. Regis' not in school and 'St Regis' not in school and 'StRegis' not in school:
                    update_data['schoolType'] = 'outside'
                else:
                    update_data['schoolType'] = 'stregis'
            
            if not has_agent_id:
                update_data['agentId'] = None
            
            if not has_agent_name:
                update_data['agentName'] = None
            
            if not dry_run:
                # 更新文档
                students_ref.document(student_id).update(update_data)
                print(f"  ✅ 更新 {student_data.get('name', 'Unknown')} - schoolType: {update_data.get('schoolType', 'N/A')}")
            else:
                print(f"  🔍 [DRY RUN] 将更新 {student_data.get('name', 'Unknown')}")
                print(f"     schoolType: {update_data.get('schoolType', 'N/A')}")
                print(f"     agentId: null")
                print(f"     agentName: null")
            
            updated_count += 1
            
        except Exception as e:
            error_count += 1
            print(f"  ❌ 错误处理学生 {student_id}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("操作统计:")
    print(f"  总学生数: {total_count}")
    print(f"  更新数: {updated_count}")
    print(f"  跳过数: {skipped_count}")
    print(f"  错误数: {error_count}")
    print("=" * 60)
    
    if not dry_run and updated_count > 0:
        print("\n✅ 字段添加完成!")
        print("   所有学生现在都有 schoolType, agentId, agentName 字段")
    elif dry_run:
        print("\n🔍 DRY RUN 完成 - 没有修改数据库")
        print("   如果结果正确，请运行: python scripts/add_student_agent_fields.py")

def verify_fields():
    """验证所有学生是否都有新字段"""
    db = init_firestore()
    
    print("\n" + "=" * 60)
    print("验证字段...")
    print("=" * 60)
    
    students = db.collection('students').stream()
    
    missing_fields = {
        'schoolType': [],
        'agentId': [],
        'agentName': []
    }
    
    total = 0
    for student_doc in students:
        total += 1
        data = student_doc.to_dict()
        
        if 'schoolType' not in data:
            missing_fields['schoolType'].append(student_doc.id)
        if 'agentId' not in data:
            missing_fields['agentId'].append(student_doc.id)
        if 'agentName' not in data:
            missing_fields['agentName'].append(student_doc.id)
    
    print(f"\n总学生数: {total}")
    print(f"缺少 schoolType: {len(missing_fields['schoolType'])}")
    print(f"缺少 agentId: {len(missing_fields['agentId'])}")
    print(f"缺少 agentName: {len(missing_fields['agentName'])}")
    
    if all(len(v) == 0 for v in missing_fields.values()):
        print("\n✅ 所有学生都有完整的Agent字段!")
    else:
        print("\n⚠️  有学生缺少字段，请重新运行迁移")

if __name__ == '__main__':
    dry_run = '--dry-run' in sys.argv
    verify = '--verify' in sys.argv
    auto_confirm = '--yes' in sys.argv or '-y' in sys.argv
    
    try:
        if verify:
            verify_fields()
        else:
            add_agent_fields(dry_run=dry_run, auto_confirm=auto_confirm)
            
            if not dry_run:
                # 自动验证
                verify_fields()
    
    except Exception as e:
        print(f"\n❌ 操作失败: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

