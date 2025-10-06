# 数据管理脚本使用说明

## 目录

1. [学生数据导入脚本](#学生数据导入脚本)
2. [课程价格批量更新脚本](#课程价格批量更新脚本)

---

## 学生数据导入脚本

### 功能说明

`import-student-updates.ts` 脚本用于将更新的学生数据批量导入到 Firestore 数据库中。

**脚本会自动处理：**

✅ **学生记录 (students)**
- 创建新学生或更新现有学生
- 自动识别学校类型（St. Reigs = 本校，Outside = 外校）
- 关联中介信息（如果有）

✅ **中介记录 (agents)**
- 自动创建新的中介记录（如果不存在）

✅ **注册记录 (enrollments)**
- 创建新的课程注册记录
- 更新现有注册记录的成绩和评论
- 记录 MyEdBC 状态

⏭️ **自动跳过**
- 状态为 "Not Ready" 的记录
- 无效或不完整的数据

---

## 使用步骤

### 1. 安装依赖

如果是首次运行，需要安装新的依赖包：

```bash
cd /home/borui/apps/st-regis-student-management/WEB_APP
npm install
```

### 2. 检查环境变量

确保 `.env.local` 文件中包含以下配置：

```bash
# Firebase Admin SDK
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_DATABASE_ID=studentapp
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. 更新数据

打开 `scripts/import-student-updates.ts` 文件，找到 `studentData` 数组，将最新的学生数据粘贴进去。

**数据格式示例：**

```typescript
const studentData = [
  {
    id: 1,
    agent: 'Alex',                          // 中介名称（可选）
    name: 'He, Yiran',                      // 学生姓名
    school: 'St. Reigs',                    // 学校
    email: 'heyiran85@gmail.com',           // 邮箱
    course: 'Pre Calculus 12',              // 课程名称
    teacher: 'Mr. Song',                    // 教师
    status: 'Opened',                       // 状态（必须是 'Opened'）
    midtermGrade: '85',                     // 期中成绩（可选）
    finalGrade: '90',                       // 期末成绩（可选）
    endTime: 'Jan 20th, 2026',              // 结束时间
    midtermComments: '',                    // 期中评论（可选）
    finalComments: '',                      // 期末评论（可选）
    myEdBC: 'Added'                         // MyEdBC状态（可选）
  },
  // ... 更多记录
];
```

### 4. 运行导入脚本

```bash
npm run import:students
```

### 5. 查看导入结果

脚本会显示详细的导入过程和统计信息：

```
🚀 开始导入学生数据...

📊 找到 25 个唯一学生，共 33 条注册记录

👤 处理学生: He, Yiran (heyiran85@gmail.com)
  🔄 更新现有学生 (ID: abc123)
  📚 处理课程: Pre Calculus 12
    🔄 更新现有注册记录
    ✅ 注册记录更新成功

...

============================================================
📊 导入完成统计:
============================================================
👥 学生处理: 25 个
  ➕ 新创建: 5 个
  🔄 已更新: 20 个

📚 注册记录处理: 33 条
  ➕ 新创建: 10 条
  🔄 已更新: 23 条

❌ 错误: 0 个
============================================================

✅ 导入完成！
```

---

## 注意事项

### ⚠️ 重要提示

1. **备份数据**
   - 运行前建议先备份 Firestore 数据
   - 可以在 Firebase Console 中导出数据

2. **测试环境**
   - 建议先在测试环境运行
   - 确认无误后再在生产环境执行

3. **数据验证**
   - 检查邮箱格式是否正确
   - 确认课程名称与数据库中的匹配
   - 确认教师名称正确

4. **状态过滤**
   - 只有 `status: 'Opened'` 的记录会被处理
   - `status: 'Not Ready'` 的记录会自动跳过

### 🔍 常见问题

**Q: 课程不存在怎么办？**
A: 脚本会跳过不存在的课程，并在日志中显示警告。需要先在系统中创建课程。

**Q: 同一个学生有多条记录？**
A: 脚本会自动按邮箱分组，一个学生可以有多个课程注册记录。

**Q: 中介信息如何处理？**
A: 如果中介不存在，脚本会自动创建新的中介记录。

**Q: 如何更新成绩？**
A: 只需在 `studentData` 中填写 `midtermGrade` 和 `finalGrade` 字段。

---

## 脚本功能详解

### 数据处理流程

```
1. 读取学生数据 → 过滤 Not Ready 记录
2. 按邮箱分组（一个学生多门课程）
3. 处理中介信息
   ├─ 查找现有中介
   └─ 创建新中介（如不存在）
4. 处理学生记录
   ├─ 查找现有学生（按邮箱）
   ├─ 创建新学生 or 更新学生信息
   └─ 关联中介
5. 处理课程注册
   ├─ 查找课程（按课程名称）
   ├─ 查找注册记录（学生+课程）
   └─ 创建 or 更新注册记录（含成绩）
```

### 更新的字段

**学生表 (students)**
```typescript
{
  name: string,
  email: string,
  school: string,
  schoolType: 'stregis' | 'outside',
  agentId?: string,
  agentName?: string,
  currentCourses: number,
  updatedAt: Timestamp
}
```

**注册表 (enrollments)**
```typescript
{
  studentId: string,
  studentName: string,
  studentEmail: string,
  courseId: string,
  courseName: string,
  teacherName: string,
  endDate: string,
  midtermMark?: string,
  midtermComments?: string,
  finalGrade?: string,
  finalComments?: string,
  myEdBCStatus?: string,
  updatedAt: Timestamp
}
```

---

## 技术细节

### 依赖包

- `firebase-admin` - Firestore 数据库操作
- `tsx` - TypeScript 执行器
- `dotenv` - 环境变量加载

### 性能优化

- ✅ 批量查询（减少读取次数）
- ✅ 智能缓存（中介映射）
- ✅ 错误隔离（单个错误不影响整体）

### 安全特性

- ✅ 事务安全（每条记录独立处理）
- ✅ 数据验证（跳过无效记录）
- ✅ 详细日志（可追踪每个操作）

---

## 维护和扩展

### 添加新字段

在脚本中修改相应的接口和数据映射：

```typescript
// 1. 更新 EnrollmentRecord 接口
interface EnrollmentRecord {
  // ... 现有字段
  newField?: string;  // 添加新字段
}

// 2. 在数据处理中映射新字段
const enrollmentData = {
  // ... 现有字段
  newField: courseData.newField,  // 映射新字段
};
```

### 修改过滤条件

```typescript
// 当前：只处理 Opened 状态
if (row.status !== 'Opened') {
  continue;
}

// 可以修改为：
if (!['Opened', 'Ready'].includes(row.status)) {
  continue;
}
```

---

## 联系和支持

如有问题，请检查：
1. 日志输出中的错误信息
2. Firestore 控制台中的数据
3. 环境变量配置是否正确

---

---

## 课程价格批量更新脚本

### 功能说明

`update-course-prices.ts` 脚本用于批量更新所有课程的价格。

**使用场景：**
- ✅ 从 Moodle 同步课程后（默认价格为 $0）
- ✅ 统一调整所有课程价格
- ✅ 按类别设置不同价格

**自动处理：**
- 🔵 理科课程 → $1,800 CAD
- 🟣 文科课程 → $1,600 CAD
- ⚪ 其他课程 → $0 CAD

---

### 使用步骤

#### 1. 运行更新脚本

```bash
npm run update:prices
```

#### 2. 查看价格配置

脚本会显示当前配置：
```
💰 价格配置:
  理科课程 (Science): $1800
  文科课程 (Arts): $1600
  其他课程: $0
```

#### 3. 确认更新

等待 3 秒或按 `Ctrl+C` 取消

#### 4. 查看结果

```
📊 更新完成统计:
📚 总课程数: 50 门
✅ 成功更新: 45 门
  🔵 理科课程 ($1800): 25 门
  🟣 文科课程 ($1600): 20 门
  ⚪ 其他课程 ($0): 0 门
⏭️  已跳过: 5 门
❌ 错误: 0 门
```

---

### 自定义价格

如需修改价格，编辑 `scripts/update-course-prices.ts`：

```typescript
// 价格配置
const PRICES = {
  science: 1800,  // 理科课程价格（CAD）
  arts: 1600,     // 文科课程价格（CAD）
  default: 0,     // 默认价格
};
```

修改后重新运行：
```bash
npm run update:prices
```

---

### 注意事项

⚠️ **重要提示：**

1. **备份数据**
   - 建议先在测试环境运行
   - 或导出 Firestore 数据备份

2. **价格覆盖**
   - 脚本会覆盖所有课程的现有价格
   - 已正确价格的课程会自动跳过

3. **价格单位**
   - 默认为加拿大元（CAD）
   - 确保与系统其他部分一致

4. **运行时机**
   - 建议在 Moodle 同步后立即运行
   - 或在学期开始前统一设置

---

### 常见问题

**Q: 可以只更新部分课程吗？**

A: 可以。修改脚本添加过滤条件：

```typescript
// 只更新特定年级
if (course.gradeLevel && course.gradeLevel >= 10 && course.gradeLevel <= 12) {
  // 更新
}

// 只更新特定科目
if (course.subject === 'Mathematics') {
  // 更新
}
```

**Q: 如何回滚价格？**

A: 两种方式：
1. 修改 `PRICES` 配置，重新运行脚本
2. 在 Firestore Console 手动修改

**Q: 脚本会影响已有的注册记录吗？**

A: 不会。脚本只更新 `courses` 集合中的 `basePrice` 字段，不影响已有的 `enrollments` 或 `payments` 记录。

---

### 完整工作流

**推荐流程：**

```bash
# 1. 同步 Moodle 课程（Web 界面）
# 访问 /admin/courses，点击"开始同步"

# 2. 批量更新价格
npm run update:prices

# 3. 验证价格
# 访问 /admin/courses，查看课程列表

# 4. 开始使用
# 学生现在可以选课了！
```

---

**最后更新：** 2025-10-05
**版本：** 1.0.0
