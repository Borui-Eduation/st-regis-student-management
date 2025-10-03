# 🔥 Firestore 连接测试项目

这是一个基于 **Python 虚拟环境** 的项目，用于测试与 Google Firestore 的连接。

使用 Firebase Admin Python SDK 官方最佳实践构建。

## 📁 项目结构

```
.
├── borui-education-4fd6c77422e0.json  # Firebase 服务账号凭证文件
├── test_firestore.py                   # 测试脚本（包含完整 CRUD 操作）
├── requirements.txt                    # Python 依赖包
├── setup.sh                            # 自动化设置脚本 (Mac/Linux)
├── setup.bat                           # 自动化设置脚本 (Windows)
├── run.sh                              # 快速运行脚本 (Mac/Linux)
├── .gitignore                          # Git 忽略文件
└── README.md                           # 说明文档
```

## 🚀 快速开始

### 方法一：自动化安装（推荐）

**Mac/Linux:**
```bash
# 1. 赋予执行权限
chmod +x setup.sh run.sh

# 2. 运行设置脚本（创建虚拟环境并安装依赖）
./setup.sh

# 3. 运行测试
./run.sh
```

**Windows:**
```cmd
# 1. 运行设置脚本
setup.bat

# 2. 运行测试
run.bat
```

### 方法二：手动安装

1. **确保已安装 Python 3.7+**
   ```bash
   python3 --version
   ```

2. **创建虚拟环境**
   ```bash
   # Mac/Linux
   python3 -m venv venv
   
   # Windows
   python -m venv venv
   ```

3. **激活虚拟环境**
   ```bash
   # Mac/Linux
   source venv/bin/activate
   
   # Windows
   venv\Scripts\activate
   ```
   
   激活后，终端提示符前会出现 `(venv)` 标识。

4. **安装依赖包**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. **运行测试脚本**
   ```bash
   python test_firestore.py
   ```

6. **退出虚拟环境**
   ```bash
   deactivate
   ```

## 🧪 测试内容

脚本会执行以下完整的 CRUD 操作测试：

1. ✓ **初始化** - Firebase Admin SDK 认证
2. ✓ **连接** - 创建 Firestore 客户端
3. ✓ **创建 (Create)** - 写入测试数据（含嵌套对象）
4. ✓ **读取 (Read)** - 读取文档数据
5. ✓ **更新 (Update)** - 更新字段（含增量操作）
6. ✓ **查询 (Query)** - 使用 FieldFilter 查询
7. ✓ **批量操作 (Batch)** - 批量写入多个文档
8. ✓ **删除 (Delete)** - 清理测试数据（可选）
9. ✓ **统计** - 列出所有集合及文档数量

## ⚙️ 虚拟环境管理

### 为什么使用虚拟环境？

- ✅ **隔离依赖**: 避免不同项目的包版本冲突
- ✅ **干净环境**: 不污染系统 Python
- ✅ **可复现性**: 确保团队成员使用相同的依赖版本
- ✅ **易于管理**: 可以轻松删除和重建

### 常用命令

```bash
# 激活虚拟环境
source venv/bin/activate     # Mac/Linux
venv\Scripts\activate        # Windows

# 查看已安装的包
pip list

# 更新包
pip install --upgrade firebase-admin

# 导出依赖（如有更新）
pip freeze > requirements.txt

# 退出虚拟环境
deactivate

# 删除虚拟环境（如需重建）
rm -rf venv                  # Mac/Linux
rmdir /s venv               # Windows
```

## 📋 注意事项

- ✅ **始终在虚拟环境中运行** - 确保 `(venv)` 标识出现在终端提示符前
- ⚠️ **保护凭证文件** - 不要提交 `.json` 凭证文件到公开仓库
- 📌 **检查 .gitignore** - 已配置忽略凭证文件和虚拟环境
- 🔒 **权限配置** - 确保服务账号在 Firebase Console 中有 Firestore 权限

## ❓ 常见问题

### 1. 模块未找到错误
**问题**: `ModuleNotFoundError: No module named 'firebase_admin'`  
**解决**: 
```bash
# 确保虚拟环境已激活
source venv/bin/activate
# 安装依赖
pip install -r requirements.txt
```

### 2. 权限错误
**问题**: `Permission denied` 或 `403 Forbidden`  
**解决**: 
- 在 Firebase Console 中检查服务账号权限
- 确保已启用 Firestore 数据库
- 检查 IAM 角色包含 "Cloud Datastore User" 或 "Editor"

### 3. 连接超时
**问题**: `TimeoutError` 或无法连接  
**解决**: 
- 检查网络连接
- 确认可以访问 googleapis.com
- 如在中国大陆，可能需要配置代理

### 4. 虚拟环境激活失败
**问题**: `venv/bin/activate: No such file or directory`  
**解决**: 
```bash
# 重新创建虚拟环境
python3 -m venv venv
```

### 5. Windows 执行策略错误
**问题**: `cannot be loaded because running scripts is disabled`  
**解决**: 
```powershell
# 在 PowerShell 中以管理员身份运行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📊 预期输出示例

```
🔥 Firebase Firestore 连接测试工具
运行时间: 2025-10-02 14:30:00

============================================================
开始测试 Firestore 连接...
============================================================

步骤 1: 初始化 Firebase Admin SDK
  使用服务账号凭证文件进行认证...
  ✓ Firebase Admin SDK 初始化成功
  项目 ID: borui-education

步骤 2: 获取 Firestore 客户端
  ✓ Firestore 客户端创建成功

步骤 3: 测试写入数据 (Create)
  集合: test_connection
  文档 ID: test_document_20251002_143000
  ✓ 成功写入测试数据
  ...

============================================================
✓ 所有测试通过！Firestore 连接和操作正常
============================================================
```

## 🎯 下一步开发建议

连接测试成功后，您可以：

### 1. 设计数据模型
创建学生管理相关的集合：
```
students/        # 学生信息
  - name, age, grade, contact, etc.
classes/         # 班级信息
  - className, teacher, schedule, etc.
grades/          # 成绩记录
  - studentId, subject, score, date, etc.
attendance/      # 考勤记录
  - studentId, date, status, etc.
```

### 2. 实现业务逻辑
- 学生 CRUD 操作
- 班级管理
- 成绩录入与查询
- 考勤统计
- 数据导入/导出

### 3. 构建应用层
- **Web 应用**: Flask/FastAPI + Vue.js/React
- **移动应用**: Flutter/React Native
- **桌面应用**: PyQt/Tkinter
- **API 服务**: RESTful API

### 4. 添加高级功能
- 用户认证（Firebase Auth）
- 实时数据同步
- 数据验证和安全规则
- 文件存储（Firebase Storage）
- 推送通知

## 📚 相关资源

- [Firebase Admin Python SDK 官方文档](https://firebase.google.com/docs/admin/setup)
- [Cloud Firestore 文档](https://firebase.google.com/docs/firestore)
- [Python Firestore Client 库](https://github.com/googleapis/python-firestore)
- [Firebase Console](https://console.firebase.google.com/)

## 🤝 贡献与支持

如有问题或建议，欢迎提出 Issue。

---

**项目**: 博睿教育学生管理系统 - Firestore 测试模块  
**版本**: 1.0.0  
**最后更新**: 2025-10-02

