#!/bin/bash
# 完整业务流程测试脚本

API_BASE="http://localhost:3000"
TEST_STUDENT="TEST_STUDENT_$(date +%s)"

echo "================================================================================"
echo "🎯 St Regis 选课系统 - 完整流程测试"
echo "================================================================================"
echo ""

# 第一步：创建测试学生和获取课程
echo "📋 步骤 1/5: 准备测试数据"
echo "--------------------------------------------------------------------------------"
python3 << 'EOF'
import os, sys
from google.cloud import firestore
from datetime import datetime
import random

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './borui-education-4fd6c77422e0.json'
client = firestore.Client(project='borui-education', database='studentapp')

# 创建测试学生
student_id = sys.argv[1] if len(sys.argv) > 1 else f"TEST_STUDENT_{int(datetime.now().timestamp())}"
student_data = {
    "studentId": student_id,
    "name": "测试学生",
    "email": f"test{random.randint(1000,9999)}@example.com",
    "phoneNumber": "13800138000",
    "currentCourses": 0,
    "status": "active",
    "enrollmentDate": firestore.SERVER_TIMESTAMP,
    "createdAt": firestore.SERVER_TIMESTAMP,
    "updatedAt": firestore.SERVER_TIMESTAMP,
}
client.collection('students').document(student_id).set(student_data)
print(f"✅ 创建测试学生: {student_data['name']} (ID: {student_id})")

# 获取前2门课程
courses = list(client.collection('courses').where('status', '==', 'active').limit(2).stream())
if len(courses) == 0:
    print("❌ 错误: 没有可用课程")
    sys.exit(1)

print(f"✅ 找到 {len(courses)} 门可选课程")
for i, course_doc in enumerate(courses, 1):
    course = course_doc.to_dict()
    print(f"   {i}. {course.get('courseName')} - ${course.get('price', 1200)}")

# 输出给shell使用
print(f"\nSTUDENT_ID={student_id}")
for i, course_doc in enumerate(courses):
    course = course_doc.to_dict()
    print(f"COURSE_{i}_ID={course_doc.id}")
    print(f"COURSE_{i}_NAME={course.get('courseName', 'Unknown')}")
    print(f"COURSE_{i}_TEACHER={course.get('teacherName', 'Unknown')}")
    print(f"COURSE_{i}_PRICE={course.get('price', 1200)}")
    print(f"COURSE_{i}_YEAR={course.get('academicYear', '2025-2026')}")
    print(f"COURSE_{i}_SEMESTER={course.get('semester', 'Fall')}")
EOF

if [ $? -ne 0 ]; then
    echo "❌ 数据准备失败"
    exit 1
fi

# 保存输出到变量
eval $(python3 << 'EOF'
import os, sys
from google.cloud import firestore

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './borui-education-4fd6c77422e0.json'
client = firestore.Client(project='borui-education', database='studentapp')

students = list(client.collection('students').where('studentId', '>=', 'TEST_STUDENT_').limit(1).stream())
if students:
    student_id = students[0].id
    print(f"STUDENT_ID={student_id}")
    
courses = list(client.collection('courses').where('status', '==', 'active').limit(2).stream())
for i, course_doc in enumerate(courses):
    course = course_doc.to_dict()
    print(f"COURSE_{i}_ID={course_doc.id}")
    print(f"COURSE_{i}_NAME={course.get('courseName', 'Unknown').replace(' ', '_')}")
    print(f"COURSE_{i}_TEACHER={course.get('teacherName', 'Unknown').replace(' ', '_')}")
    print(f"COURSE_{i}_PRICE={course.get('price', 1200)}")
    print(f"COURSE_{i}_YEAR={course.get('academicYear', '2025-2026')}")
    print(f"COURSE_{i}_SEMESTER={course.get('semester', 'Fall')}")
EOF
)

echo ""
echo "学生ID: $STUDENT_ID"
echo "课程1: $COURSE_0_NAME"
echo "课程2: $COURSE_1_NAME"
echo ""

sleep 2

# 第二步：提交选课申请
echo "🎓 步骤 2/5: 学生提交选课申请"
echo "--------------------------------------------------------------------------------"

# 构建JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "userId": "$STUDENT_ID",
  "cartItems": [
    {
      "courseId": "$COURSE_0_ID",
      "courseName": "$COURSE_0_NAME",
      "teacherName": "$COURSE_0_TEACHER",
      "price": $COURSE_0_PRICE,
      "academicYear": "$COURSE_0_YEAR",
      "semester": "$COURSE_0_SEMESTER"
    },
    {
      "courseId": "$COURSE_1_ID",
      "courseName": "$COURSE_1_NAME",
      "teacherName": "$COURSE_1_TEACHER",
      "price": $COURSE_1_PRICE,
      "academicYear": "$COURSE_1_YEAR",
      "semester": "$COURSE_1_SEMESTER"
    }
  ]
}
EOF
)

echo "📤 发送注册请求..."
RESPONSE=$(curl -s -X POST "$API_BASE/api/enroll/submit" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

echo "📥 响应: $RESPONSE"

# 提取 enrollment IDs
ENROLLMENT_IDS=$(echo $RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(' '.join(data.get('data', {}).get('enrollmentIds', [])))" 2>/dev/null)

if [ -z "$ENROLLMENT_IDS" ]; then
    echo "❌ 提交失败或无法获取注册ID"
    exit 1
fi

echo "✅ 获得注册ID: $ENROLLMENT_IDS"
echo ""

sleep 2

# 第三步：管理员审批
echo "👨‍💼 步骤 3/5: 管理员审批"
echo "--------------------------------------------------------------------------------"

for ENROLLMENT_ID in $ENROLLMENT_IDS; do
    echo "审批注册: $ENROLLMENT_ID"
    
    APPROVE_RESPONSE=$(curl -s -X POST "$API_BASE/api/admin/approve" \
      -H "Content-Type: application/json" \
      -d "{
        \"enrollmentId\": \"$ENROLLMENT_ID\",
        \"adminEmail\": \"admin@stregis.edu\",
        \"comments\": \"测试审批通过\"
      }")
    
    echo "   响应: $APPROVE_RESPONSE"
    sleep 1
done

echo ""
sleep 2

# 第四步：IT 开课
echo "💻 步骤 4/5: IT 开课"
echo "--------------------------------------------------------------------------------"

COUNTER=1
for ENROLLMENT_ID in $ENROLLMENT_IDS; do
    echo "开课: $ENROLLMENT_ID"
    
    OPEN_RESPONSE=$(curl -s -X POST "$API_BASE/api/it/open-course" \
      -H "Content-Type: application/json" \
      -d "{
        \"enrollmentId\": \"$ENROLLMENT_ID\",
        \"itEmail\": \"it@stregis.edu\",
        \"moodleCourseId\": \"COURSE_${COUNTER}\",
        \"moodleEnrollmentUrl\": \"https://moodle.stregis.edu/course/${COUNTER}\",
        \"comments\": \"测试开课成功\"
      }")
    
    echo "   响应: $OPEN_RESPONSE"
    COUNTER=$((COUNTER + 1))
    sleep 1
done

echo ""
sleep 1

# 第五步：验证结果
echo "📊 步骤 5/5: 验证结果"
echo "--------------------------------------------------------------------------------"

echo "查询所有注册记录..."
curl -s "$API_BASE/api/admin/enrollments/pending" | python3 -m json.tool | head -30

echo ""
echo "================================================================================"
echo "🎉 测试完成！"
echo "================================================================================"
echo ""
echo "💡 提示："
echo "   - 访问管理员页面: $API_BASE/admin"
echo "   - 访问IT页面: $API_BASE/it"
echo "   - 学生ID: $STUDENT_ID"
echo ""

