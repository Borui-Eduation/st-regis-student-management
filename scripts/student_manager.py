#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
学生管理系统
提供学生、课程、注册记录的 CRUD 操作
"""

from google.cloud import firestore
import os
from datetime import datetime


# 设置认证
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'borui-education-4fd6c77422e0.json'

# 连接到 Firestore
db = firestore.Client(project='borui-education', database='studentapp')


class StudentManager:
    """学生管理类"""
    
    @staticmethod
    def create_student(name, email, school="St. Regis"):
        """创建新学生"""
        student_data = {
            'name': name,
            'email': email.lower().strip() if email else None,
            'school': school,
            'status': 'active',
            'currentCourses': 0,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = db.collection('students').document()
        doc_ref.set(student_data)
        
        print(f"✓ 学生创建成功! ID: {doc_ref.id}")
        return doc_ref.id
    
    @staticmethod
    def get_student_by_email(email):
        """通过邮箱查找学生"""
        students = db.collection('students')\
            .where('email', '==', email.lower().strip())\
            .limit(1)\
            .stream()
        
        for student in students:
            return student.id, student.to_dict()
        
        return None, None
    
    @staticmethod
    def get_student_by_name(name):
        """通过姓名查找学生"""
        students = db.collection('students')\
            .where('name', '==', name)\
            .limit(1)\
            .stream()
        
        for student in students:
            return student.id, student.to_dict()
        
        return None, None
    
    @staticmethod
    def update_student(student_id, **kwargs):
        """更新学生信息"""
        update_data = {
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        update_data.update(kwargs)
        
        db.collection('students').document(student_id).update(update_data)
        print(f"✓ 学生信息更新成功!")
    
    @staticmethod
    def delete_student(student_id):
        """删除学生（软删除，只更新状态）"""
        db.collection('students').document(student_id).update({
            'status': 'inactive',
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        print(f"✓ 学生状态已更新为 inactive")


class CourseManager:
    """课程管理类"""
    
    @staticmethod
    def create_course(course_name, teacher_name, subject, grade_level, 
                     academic_year="2025-2026"):
        """创建新课程"""
        course_data = {
            'courseName': course_name,
            'subject': subject,
            'gradeLevel': grade_level,
            'teacherName': teacher_name,
            'academicYear': academic_year,
            'semester': 'Fall',
            'currentEnrollment': 0,
            'status': 'active',
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = db.collection('courses').document()
        doc_ref.set(course_data)
        
        print(f"✓ 课程创建成功! ID: {doc_ref.id}")
        return doc_ref.id
    
    @staticmethod
    def get_course_by_name(course_name, academic_year="2025-2026"):
        """通过课程名查找课程"""
        courses = db.collection('courses')\
            .where('courseName', '==', course_name)\
            .where('academicYear', '==', academic_year)\
            .limit(1)\
            .stream()
        
        for course in courses:
            return course.id, course.to_dict()
        
        return None, None
    
    @staticmethod
    def update_course(course_id, **kwargs):
        """更新课程信息"""
        update_data = {
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        update_data.update(kwargs)
        
        db.collection('courses').document(course_id).update(update_data)
        print(f"✓ 课程信息更新成功!")
    
    @staticmethod
    def list_all_courses(academic_year="2025-2026"):
        """列出所有课程"""
        courses = db.collection('courses')\
            .where('academicYear', '==', academic_year)\
            .where('status', '==', 'active')\
            .order_by('courseName')\
            .stream()
        
        course_list = []
        for course in courses:
            data = course.to_dict()
            course_list.append({
                'id': course.id,
                'name': data.get('courseName'),
                'teacher': data.get('teacherName'),
                'enrollment': data.get('currentEnrollment', 0)
            })
        
        return course_list


class EnrollmentManager:
    """注册管理类"""
    
    @staticmethod
    def enroll_student(student_name, student_email, course_name, 
                      teacher_name, academic_year="2025-2026"):
        """学生选课"""
        # 获取学生和课程ID
        student_id, student_data = StudentManager.get_student_by_name(student_name)
        if not student_id:
            print(f"✗ 未找到学生: {student_name}")
            return None
        
        course_id, course_data = CourseManager.get_course_by_name(course_name, academic_year)
        if not course_id:
            print(f"✗ 未找到课程: {course_name}")
            return None
        
        # 检查是否已经注册
        existing = db.collection('enrollments')\
            .where('studentId', '==', student_id)\
            .where('courseId', '==', course_id)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        if len(list(existing)) > 0:
            print(f"⚠️  学生已经注册此课程")
            return None
        
        # 创建注册记录
        enrollment_data = {
            'studentId': student_id,
            'studentName': student_name,
            'studentEmail': student_email,
            
            'courseId': course_id,
            'courseName': course_name,
            
            'teacherName': teacher_name,
            
            'academicYear': academic_year,
            'semester': 'Fall',
            'startDate': '2025-09-01',
            'endDate': 'Jan 20th, 2026',
            
            'midtermMark': 'Opened',
            'midtermComments': '',
            'finalGrade': None,
            'finalComments': '',
            
            'status': 'active',
            'myEdBCStatus': '',
            'paid': False,
            'paidDate': None,
            
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = db.collection('enrollments').document()
        doc_ref.set(enrollment_data)
        
        # 更新统计
        db.collection('students').document(student_id).update({
            'currentCourses': firestore.Increment(1)
        })
        db.collection('courses').document(course_id).update({
            'currentEnrollment': firestore.Increment(1)
        })
        
        print(f"✓ 选课成功! {student_name} → {course_name}")
        return doc_ref.id
    
    @staticmethod
    def update_grade(student_name, course_name, midterm_mark=None, 
                    final_grade=None, comments=None):
        """更新成绩"""
        # 查找注册记录
        enrollments = db.collection('enrollments')\
            .where('studentName', '==', student_name)\
            .where('courseName', '==', course_name)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        enrollment_id = None
        for enrollment in enrollments:
            enrollment_id = enrollment.id
            break
        
        if not enrollment_id:
            print(f"✗ 未找到注册记录: {student_name} - {course_name}")
            return False
        
        # 更新成绩
        update_data = {'updatedAt': firestore.SERVER_TIMESTAMP}
        
        if midterm_mark is not None:
            update_data['midtermMark'] = midterm_mark
        if final_grade is not None:
            update_data['finalGrade'] = final_grade
        if comments is not None:
            if midterm_mark is not None and final_grade is None:
                update_data['midtermComments'] = comments
            elif final_grade is not None:
                update_data['finalComments'] = comments
        
        db.collection('enrollments').document(enrollment_id).update(update_data)
        print(f"✓ 成绩更新成功!")
        return True
    
    @staticmethod
    def drop_course(student_name, course_name):
        """退课"""
        # 查找注册记录
        enrollments = db.collection('enrollments')\
            .where('studentName', '==', student_name)\
            .where('courseName', '==', course_name)\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        enrollment_id = None
        student_id = None
        course_id = None
        
        for enrollment in enrollments:
            enrollment_id = enrollment.id
            data = enrollment.to_dict()
            student_id = data.get('studentId')
            course_id = data.get('courseId')
            break
        
        if not enrollment_id:
            print(f"✗ 未找到注册记录: {student_name} - {course_name}")
            return False
        
        # 更新状态为 dropped
        db.collection('enrollments').document(enrollment_id).update({
            'status': 'dropped',
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        # 更新统计
        if student_id:
            db.collection('students').document(student_id).update({
                'currentCourses': firestore.Increment(-1)
            })
        if course_id:
            db.collection('courses').document(course_id).update({
                'currentEnrollment': firestore.Increment(-1)
            })
        
        print(f"✓ 退课成功! {student_name} 退出 {course_name}")
        return True


def demo():
    """演示所有功能"""
    print("\n" + "=" * 80)
    print("📚 学生管理系统演示")
    print("=" * 80)
    
    # 示例1：创建新学生
    print("\n【示例 1】创建新学生")
    print("-" * 80)
    # student_id = StudentManager.create_student("Test, Student", "test@example.com")
    
    # 示例2：查找学生
    print("\n【示例 2】查找学生")
    print("-" * 80)
    student_id, student_data = StudentManager.get_student_by_name("He, Yiran")
    if student_data:
        print(f"找到学生:")
        print(f"  ID: {student_id}")
        print(f"  姓名: {student_data['name']}")
        print(f"  邮箱: {student_data.get('email', 'N/A')}")
        print(f"  选课数: {student_data.get('currentCourses', 0)}")
    
    # 示例3：列出所有课程
    print("\n【示例 3】列出所有课程")
    print("-" * 80)
    courses = CourseManager.list_all_courses()
    for i, course in enumerate(courses[:5], 1):
        print(f"{i}. {course['name']:<35} | {course['teacher']:<15} | {course['enrollment']} 人")
    print(f"... 共 {len(courses)} 门课程")
    
    # 示例4：更新成绩（注释掉，避免实际修改数据）
    print("\n【示例 4】更新成绩")
    print("-" * 80)
    print("演示代码（未执行）:")
    print("EnrollmentManager.update_grade('He, Yiran', 'Pre Calculus 12', midterm_mark=85)")
    
    print("\n" + "=" * 80)
    print("提示: 查看源代码了解完整功能")
    print("=" * 80)


if __name__ == "__main__":
    demo()

