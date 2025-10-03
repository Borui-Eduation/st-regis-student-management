# Python 脚本说明

本目录包含用于数据管理和维护的 Python 工具脚本。

---

## 📋 脚本列表

### 1. `clean_excel_data.py` ⭐ **推荐使用**

**功能**: Excel 数据清洗脚本

对原始 Excel 文件进行数据清洗：
- 去除前后空格和换行符
- 标准化课程名称（修正拼写错误）
- 标准化教师名称
- 验证邮箱格式
- 从学生注册表中提取唯一课程列表
- 自动分类文理科

**使用方法**:
```bash
python scripts/clean_excel_data.py
```

**输入文件**: `St Regis Online Courses Form.xlsx`

**输出文件**:
- `St Regis Online Courses Form (Cleaned).xlsx` - 清洗后的学生数据
- `Courses List (Extracted).xlsx` - 提取的课程列表（用于导入）

---

### 2. `reset_database.py` ⚠️ **危险操作**

**功能**: 数据库重置脚本

清空 Firestore 数据库中的所有课程和注册数据。

**删除的集合**:
- ✅ `courses` (课程)
- ✅ `enrollments` (注册记录)
- ✅ `payments` (付款记录)

**保留的集合**:
- ✅ `students` (学生/用户) - **不会删除**

**使用方法**:
```bash
python scripts/reset_database.py
# 输入 "YES DELETE ALL" 确认操作
```

⚠️ **警告**: 此操作不可逆！请在重置前备份重要数据。

---

### 3. `import_courses.py`

**功能**: 课程数据导入脚本

从清洗后的 Excel 文件导入课程数据到 Firestore。

**使用方法**:
```bash
python scripts/import_courses.py
```

**前置条件**:
- 必须先运行 `clean_excel_data.py` 生成清洗后的数据
- 输入文件: `Courses List (Extracted).xlsx`

**导入的数据字段**:
- 课程名称、科目、教师
- 年级、类别（文科/理科）
- 名额限制、基础价格
- 学年、学期、状态

---

### 4. `import_data.py` (旧版)

**功能**: 原始数据导入脚本

从 Excel 导入学生课程数据到 Firestore（包含学生和注册记录）。

**使用方法**:
```bash
python scripts/import_data.py
```

**注意**: 推荐使用新的 `clean_excel_data.py` + `import_courses.py` 流程。

---

### 5. `student_manager.py`

**功能**: 学生数据管理工具

批量管理学生数据：
- 查询学生信息
- 批量更新学生数据
- 导出学生列表
- 数据验证和清理

**使用方法**:
```bash
python scripts/student_manager.py
```

---

## 🔄 完整工作流程

### 数据清洗与导入（推荐）

```bash
# 步骤1：清洗 Excel 数据
python scripts/clean_excel_data.py

# 步骤2：重置数据库（可选，仅在需要清空数据时）
python scripts/reset_database.py

# 步骤3：导入清洗后的课程数据
python scripts/import_courses.py

# 步骤4：访问应用验证数据
# http://localhost:3000/student
```

### 数据清洗效果

**清洗前问题**:
- ❌ 课程名称有空格和换行符
- ❌ 教师名称不规范
- ❌ 邮箱格式错误
- ❌ 数据重复

**清洗后**:
- ✅ 统一格式，去除特殊字符
- ✅ 标准化教师名称（N/A → TBD）
- ✅ 验证邮箱格式
- ✅ 提取唯一课程列表
- ✅ 自动分类文理科
- ✅ 添加完整的课程元数据

---

## 🔧 环境设置

### 1. 安装依赖

```bash
# 在项目根目录执行
pip install -r requirements.txt
```

### 2. 配置 Firebase

确保项目根目录有 Firebase 服务账号密钥文件：
- `borui-education-4fd6c77422e0.json`

脚本会自动加载此文件进行身份验证。

---

## 📦 依赖包

```
google-cloud-firestore  # Firestore 客户端
pandas                  # 数据处理
openpyxl                # Excel 读写
```

---

## 🛠️ 常见问题

### 问题1：导入失败 - 权限不足

**解决**:
1. 检查 Firebase 服务账号是否有 Firestore 读写权限
2. 确认密钥文件路径正确

### 问题2：Excel 格式错误

**解决**:
1. 确保 Excel 文件包含所有必需列
2. 参考模板格式：`St Regis Online Courses Form.xlsx`

### 问题3：课程重复

**解决**:
```bash
# 重置数据库后重新导入
python scripts/reset_database.py
python scripts/import_courses.py
```

### 问题4：数据库连接错误

**解决**:
1. 确认使用 `studentapp` 数据库ID
2. 检查网络连接
3. 验证 Firebase 项目配置

---

## ⚠️ 重要提示

1. **生产环境操作**
   - 在生产环境运行脚本前，务必先在测试环境验证
   - 建议先备份数据库

2. **数据校验**
   - 导入后检查数据完整性
   - 验证课程分类是否正确
   - 确认价格设置是否准确

3. **批量操作**
   - 大批量操作时注意 Firestore 配额限制
   - 脚本已使用批处理 (batch) 提高效率

---

## 📊 数据统计示例

### 最近一次清洗结果:
```
原始数据: 38 行
清洗后: 32 行有效数据
唯一课程: 19 门
唯一教师: 5 位

文科课程: 9 门 ($400/门)
理科课程: 10 门 ($550/门)
```

---

## 📝 脚本开发指南

### 添加新脚本

1. 在 `scripts/` 目录创建新的 `.py` 文件
2. 导入必要的库：
   ```python
   from google.cloud import firestore
   import pandas as pd
   import os
   
   # 设置认证
   os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'borui-education-4fd6c77422e0.json'
   ```

3. 连接 Firestore：
   ```python
   db = firestore.Client(project='borui-education', database='studentapp')
   ```

4. 在本 README 中添加说明

---

## 🔗 相关文档

- [主项目文档](../README.md)
- [前端文档](../WEB_APP/README.md)
- [权限系统](../WEB_APP/PERMISSIONS_GUIDE.md)
- [项目结构](../PROJECT_STRUCTURE.md)

---

**最后更新**: 2025-10-03  
**脚本状态**: 🟢 全部可用
