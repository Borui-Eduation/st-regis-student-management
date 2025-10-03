#!/usr/bin/env python3
"""
课程数据导入脚本
从清洗后的 Excel 文件导入课程数据到 Firestore
"""

from google.cloud import firestore
import pandas as pd
from datetime import datetime
import os
import sys

# 设置认证
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'borui-education-4fd6c77422e0.json'

def main():
    print('📥 课程数据导入脚本\n')
    print('=' * 70)
    
    # 连接 Firestore
    print('🔧 连接 Firestore...')
    try:
        db = firestore.Client(project='borui-education', database='studentapp')
        print('✅ Firestore 连接成功 (database: studentapp)\n')
    except Exception as e:
        print(f'❌ Firestore 连接失败: {e}')
        sys.exit(1)
    
    # 读取清洗后的课程数据
    print('📖 读取课程数据...')
    try:
        courses_df = pd.read_excel('Courses List (Extracted).xlsx')
        print(f'✅ 读取成功: {len(courses_df)} 门课程\n')
    except FileNotFoundError:
        print('❌ 错误: 找不到 "Courses List (Extracted).xlsx"')
        print('💡 请先运行 clean_excel_data.py 生成清洗后的数据')
        sys.exit(1)
    
    # 导入课程
    print('📚 开始导入课程...\n')
    courses_collection = db.collection('courses')
    
    imported = 0
    errors = 0
    
    for index, row in courses_df.iterrows():
        try:
            course_data = {
                'courseName': row['courseName'],
                'subject': row['subject'],
                'teacherName': row['teacherName'],
                'gradeLevel': int(row['gradeLevel']),
                'category': row['category'],
                'currentEnrollment': int(row['currentEnrollment']),
                'maxEnrollment': int(row['maxEnrollment']),
                'minEnrollment': int(row['minEnrollment']),
                'basePrice': float(row['basePrice']),
                'academicYear': row['academicYear'],
                'semester': row['semester'],
                'status': row['status'],
                'createdAt': datetime.now(),
                'updatedAt': datetime.now(),
            }
            
            # 添加到 Firestore
            doc_ref = courses_collection.add(course_data)
            imported += 1
            print(f'   ✅ [{imported}/{len(courses_df)}] {row["courseName"]} - {row["teacherName"]}')
            
        except Exception as e:
            errors += 1
            print(f'   ❌ 导入失败: {row["courseName"]} - {e}')
    
    print('\n' + '=' * 70)
    print('📊 导入统计:\n')
    print(f'   成功: {imported} 门')
    print(f'   失败: {errors} 门')
    print(f'   总计: {len(courses_df)} 门')
    
    if errors == 0:
        print('\n✨ 所有课程导入成功！')
    else:
        print(f'\n⚠️  有 {errors} 门课程导入失败，请检查错误信息')
    
    print('\n💡 下一步：访问 http://localhost:3000/student 查看课程列表')

if __name__ == '__main__':
    main()

