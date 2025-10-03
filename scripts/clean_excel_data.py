#!/usr/bin/env python3
"""
Excel 数据清洗脚本
清洗 St Regis Online Courses Form.xlsx 中的数据
"""

import pandas as pd
import re
from datetime import datetime

def clean_text(text):
    """清洗文本：去除空格、换行符"""
    if pd.isna(text):
        return text
    text = str(text)
    # 去除换行符
    text = text.replace('\n', ' ')
    # 去除多余空格
    text = re.sub(r'\s+', ' ', text)
    # 去除前后空格
    text = text.strip()
    return text if text else None

def standardize_course_name(course):
    """标准化课程名称"""
    if pd.isna(course):
        return course
    
    course = clean_text(course)
    
    # 修正常见拼写错误
    corrections = {
        'LIfe Science': 'Life Science',
        'Engliish': 'English',
        'Pre Calculus': 'Pre-Calculus',
    }
    
    for wrong, correct in corrections.items():
        if wrong in course:
            course = course.replace(wrong, correct)
    
    return course

def standardize_teacher_name(teacher):
    """标准化教师名称"""
    if pd.isna(teacher):
        return 'TBD'
    
    teacher = clean_text(teacher)
    
    # 处理特殊情况
    if 'N/A' in teacher or 'n/a' in teacher.lower():
        return 'TBD'
    
    if 'Only Final' in teacher:
        parts = teacher.split('Only Final')
        return clean_text(parts[0]) if parts[0].strip() else 'TBD'
    
    return teacher

def clean_email(email):
    """清洗邮箱地址"""
    if pd.isna(email):
        return email
    
    email = clean_text(email)
    email = email.lower()
    
    # 验证邮箱格式
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(email_pattern, email):
        return email
    else:
        print(f'⚠️  无效邮箱: {email}')
        return None

def extract_course_list(df):
    """从学生注册表中提取唯一课程列表"""
    courses = []
    
    for _, row in df.iterrows():
        course_name = standardize_course_name(row['Course'])
        teacher = standardize_teacher_name(row['Teacher'])
        
        if pd.notna(course_name):
            # 检查课程是否已存在
            existing = next((c for c in courses if c['courseName'] == course_name), None)
            
            if not existing:
                # 从课程名提取信息
                grade_match = re.search(r'\d+', course_name)
                grade = int(grade_match.group()) if grade_match else 12
                
                # 判断科目类别
                subject = course_name.split()[0] if ' ' in course_name else course_name
                
                # 判断文理科
                science_subjects = ['Math', 'Science', 'Physics', 'Chemistry', 'Biology', 
                                   'Calculus', 'Pre-Calculus', 'Life']
                category = 'science' if any(s in course_name for s in science_subjects) else 'arts'
                
                courses.append({
                    'courseName': course_name,
                    'subject': subject,
                    'teacherName': teacher,
                    'gradeLevel': grade,
                    'category': category,
                    'currentEnrollment': 0,
                    'maxEnrollment': 30,
                    'minEnrollment': 5,
                    'basePrice': 550 if category == 'science' else 400,
                    'academicYear': '2025-2026',
                    'semester': 'Spring 2026',
                    'status': 'active'
                })
    
    return pd.DataFrame(courses)

def main():
    print('🧹 开始数据清洗...\n')
    print('=' * 70)
    
    # 读取原始数据
    print('📖 读取 Excel 文件...')
    df = pd.read_excel('St Regis Online Courses Form.xlsx')
    print(f'✅ 读取成功: {len(df)} 行数据\n')
    
    # 清洗学生数据
    print('🔧 清洗学生数据...')
    df_clean = df.copy()
    df_clean['Name'] = df_clean['Name'].apply(clean_text)
    df_clean['Email'] = df_clean['Email'].apply(clean_email)
    df_clean['Course'] = df_clean['Course'].apply(standardize_course_name)
    df_clean['Teacher'] = df_clean['Teacher'].apply(standardize_teacher_name)
    
    # 移除无效行
    df_clean = df_clean.dropna(subset=['Name', 'Email', 'Course'])
    print(f'✅ 清洗完成: {len(df_clean)} 行有效数据\n')
    
    # 提取课程列表
    print('📚 提取课程列表...')
    courses_df = extract_course_list(df_clean)
    print(f'✅ 提取完成: {len(courses_df)} 门唯一课程\n')
    
    # 保存清洗后的数据
    output_students = 'St Regis Online Courses Form (Cleaned).xlsx'
    output_courses = 'Courses List (Extracted).xlsx'
    
    print('💾 保存清洗后的数据...')
    with pd.ExcelWriter(output_students, engine='openpyxl') as writer:
        df_clean.to_excel(writer, sheet_name='Student Enrollments', index=False)
    print(f'✅ 学生数据已保存: {output_students}')
    
    with pd.ExcelWriter(output_courses, engine='openpyxl') as writer:
        courses_df.to_excel(writer, sheet_name='Courses', index=False)
    print(f'✅ 课程列表已保存: {output_courses}')
    
    print('\n' + '=' * 70)
    print('📊 清洗结果统计:\n')
    print(f'   原始数据: {len(df)} 行')
    print(f'   清洗后: {len(df_clean)} 行')
    print(f'   唯一课程: {len(courses_df)} 门')
    print(f'   唯一教师: {courses_df["teacherName"].nunique()} 位')
    print(f'\n   文科课程: {len(courses_df[courses_df["category"] == "arts"])} 门')
    print(f'   理科课程: {len(courses_df[courses_df["category"] == "science"])} 门')
    
    print('\n✨ 数据清洗完成！')
    print('\n📋 课程列表预览:')
    print(courses_df[['courseName', 'teacherName', 'category', 'basePrice']].to_string(index=False))

if __name__ == '__main__':
    main()



