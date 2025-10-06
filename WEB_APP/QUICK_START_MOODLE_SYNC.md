# 🚀 Moodle 课程同步 - 快速开始

## 一分钟快速上手

### 1️⃣ 确保环境变量配置

确保 `.env.local` 包含：

```bash
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_web_service_token
```

### 2️⃣ 访问课程管理页面

```
http://localhost:3000/admin/courses
```

（生产环境替换为你的域名）

### 3️⃣ 点击"开始同步"

点击蓝色按钮 **"🔄 开始同步"**

### 4️⃣ 等待完成

看到成功提示：
```
✅ 同步成功
成功同步 XX 门课程（新增 X，更新 X）
```

### 5️⃣ 完成！

现在学生添加课程时就能看到 Moodle 的课程了！

---

## 📊 功能说明

**这个功能做什么？**

从 Moodle 获取所有课程 → 自动创建/更新到 Firestore → 学生可以选择这些课程

**自动处理：**
- ✅ 提取课程名称、代码
- ✅ 识别年级（从课程名提取）
- ✅ 分类科目（Math, Science, English 等）
- ✅ 设置价格（**默认为 $0**，需要后续手动设置）
- ✅ 关联 Moodle ID

**不会：**
- ❌ 删除现有课程
- ❌ 修改已有的注册记录
- ❌ 影响学生数据

---

## 🎯 使用场景

### 初次使用

```
Moodle 课程 → 同步 → Firestore → 学生选课
```

### 定期更新

```
新学期在 Moodle 添加课程 → 重新同步 → 新课程出现在系统中
```

---

## 📱 Docker 环境运行

如果你在 Docker 中运行：

```bash
# 进入容器
docker exec -it stregis-webapp sh

# 或者直接访问 Web 界面
http://localhost:3000/admin/courses
```

**推荐使用 Web 界面！** 有实时进度和统计信息。

---

## 🔍 验证同步成功

### 方法 1：查看课程列表

在 `/admin/courses` 页面，查看：
- Moodle 列显示 ✅ "已同步"
- 课程数量增加

### 方法 2：测试添加课程

1. 进入学生详情
2. 点击 "➕ 添加课程"
3. 下拉列表中应该能看到 Moodle 课程

### 方法 3：查看 Firestore

Firebase Console → Firestore → `courses` 集合
- 查看是否有 `moodleId` 字段

---

## ⚠️ 故障排除

### 问题：同步失败

**检查清单：**
1. ✅ `MOODLE_URL` 是否正确（不要末尾加 /）
2. ✅ `MOODLE_TOKEN` 是否有效
3. ✅ Moodle Web Services 是否启用
4. ✅ Token 是否有 `core_course_get_courses` 权限

### 问题：课程信息不准确

**原因：** 自动识别可能不完美

**解决：**
1. 在 Moodle 中规范课程命名（例如："Math 12", "Physics 11"）
2. 同步后在 Firestore 中手动调整
3. 或修改 `sync-moodle/route.ts` 中的识别逻辑

### 问题：部分课程被跳过

**正常情况：**
- 站点主页课程（ID=1）会被跳过
- 没有名称的课程会被跳过

**查看日志：**
控制台会显示跳过原因

---

## 📚 完整文档

详细文档请查看：
- [完整使用指南](./MOODLE_SYNC_GUIDE.md)
- [Moodle API 测试](./MOODLE_TEST_GUIDE.md)

---

## ✨ 下一步优化（可选）

### 添加自动同步

可以设置定时任务（每天/每周）自动同步：

```typescript
// 使用 Vercel Cron Jobs
// vercel.json
{
  "crons": [{
    "path": "/api/admin/courses/sync-moodle",
    "schedule": "0 2 * * *"  // 每天凌晨2点
  }]
}
```

### 添加同步历史

记录每次同步的时间和结果：

```typescript
// 在 Firestore 中创建 sync_logs 集合
{
  syncId: string,
  timestamp: Timestamp,
  stats: { synced, created, updated, skipped },
  status: 'success' | 'failed'
}
```

### 添加课程筛选

在同步时只同步特定类别的课程：

```typescript
// 例如：只同步 Grade 10-12 的课程
if (gradeLevel && gradeLevel >= 10 && gradeLevel <= 12) {
  // 同步
}
```

---

**准备好了吗？现在就开始同步！** 🎉

访问：`/admin/courses`

---

**创建日期：** 2025-10-05  
**适用版本：** 1.0.0
