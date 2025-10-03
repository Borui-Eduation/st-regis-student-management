#!/usr/bin/env python3
"""
数据库重置脚本
清空 Firestore 数据库中的所有课程和注册数据
⚠️ 警告：此操作不可逆！
"""

from google.cloud import firestore
import os
import sys

# 设置认证
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'borui-education-4fd6c77422e0.json'

def confirm_reset():
    """确认重置操作"""
    print('⚠️  警告：此操作将删除以下集合的所有数据：')
    print('   - courses (课程)')
    print('   - enrollments (注册记录)')
    print('   - payments (付款记录)')
    print('')
    print('⚠️  注意：students (学生/用户) 集合将被保留！')
    print('')
    
    response = input('确认要继续吗？输入 "YES DELETE ALL" 确认: ')
    return response == 'YES DELETE ALL'

def delete_collection(db, collection_name, batch_size=100):
    """批量删除集合中的所有文档"""
    coll_ref = db.collection(collection_name)
    deleted = 0
    
    while True:
        docs = list(coll_ref.limit(batch_size).stream())
        if not docs:
            break
        
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
            deleted += 1
        
        batch.commit()
        print(f'   已删除 {deleted} 条记录...', end='\r')
    
    print(f'   ✅ 共删除 {deleted} 条记录' + ' ' * 20)
    return deleted

def main():
    print('🔄 数据库重置脚本\n')
    print('=' * 70)
    
    # 确认操作
    if not confirm_reset():
        print('\n❌ 操作已取消')
        sys.exit(0)
    
    print('\n🔧 连接 Firestore...')
    
    try:
        # 连接到 Firestore
        db = firestore.Client(project='borui-education', database='studentapp')
        print('✅ Firestore 连接成功 (database: studentapp)\n')
        
    except Exception as e:
        print(f'❌ Firestore 连接失败: {e}')
        sys.exit(1)
    
    print('🗑️  开始删除数据...\n')
    
    # 删除课程
    print('1️⃣  删除 courses 集合...')
    courses_deleted = delete_collection(db, 'courses')
    
    # 删除注册记录
    print('2️⃣  删除 enrollments 集合...')
    enrollments_deleted = delete_collection(db, 'enrollments')
    
    # 删除付款记录
    print('3️⃣  删除 payments 集合...')
    payments_deleted = delete_collection(db, 'payments')
    
    print('\n' + '=' * 70)
    print('📊 删除统计:\n')
    print(f'   courses: {courses_deleted} 条')
    print(f'   enrollments: {enrollments_deleted} 条')
    print(f'   payments: {payments_deleted} 条')
    print(f'   总计: {courses_deleted + enrollments_deleted + payments_deleted} 条')
    
    print('\n✅ 数据库重置完成！')
    print('💡 下一步：运行 import_courses.py 重新导入清洗后的课程数据')

if __name__ == '__main__':
    main()

