# 🎓 St Regis 学生管理系统

一个功能完整的教育机构学生管理系统，支持课程管理、学生注册、财务跟踪和权限控制。

**GitHub 仓库**: [Borui-Eduation/st-regis-student-management](https://github.com/Borui-Eduation/st-regis-student-management) 🔒

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+
- Firebase 项目（Firestore 数据库）

### 安装与启动

```bash
# 1. 安装前端依赖
cd WEB_APP
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入必要的配置

# 3. 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

---

## 📂 项目结构

```
Student APP(Google firestore)/
├── WEB_APP/                    # Next.js 前端应用
│   ├── src/
│   │   ├── app/               # 页面和路由
│   │   ├── components/        # React 组件
│   │   ├── lib/               # 核心库
│   │   ├── hooks/             # React Hooks
│   │   └── types/             # TypeScript 类型
│   ├── README.md              # 前端详细文档
│   └── PERMISSIONS_GUIDE.md   # 权限系统指南
│
├── scripts/                    # Python 工具脚本
│   ├── import_data.py         # 从Excel导入课程数据
│   └── student_manager.py     # 学生数据管理工具
│
├── functions/                  # Firebase Cloud Functions（待开发）
├── borui-education-*.json     # Firebase 服务账号密钥
└── requirements.txt           # Python 依赖
```

---

## 🔑 核心功能

### 学生功能
- ✅ Google OAuth 登录
- ✅ 浏览课程列表（表格视图，显示名额和状态）
- ✅ 选课购物车（最多4门课）
- ✅ 课程注册和缴费
- ✅ 查看个人课程和资料

### 管理员功能
- ✅ 学生管理（查看、编辑）
- ✅ 课程管理（创建、编辑、删除）
- ✅ 注册审批
- ✅ 财务统计（总收入、欠费、付款记录）
- ✅ 欠费管理（标记已付款）
- ✅ 详细统计（按科目、年级、教师）

### IT功能
- ✅ 用户管理
- ✅ 系统配置
- ✅ 权限控制

### 超级管理员功能
- ✅ 所有管理员和IT权限
- ✅ 管理其他管理员
- ✅ 系统维护

---

## 🎨 技术栈

### 前端
- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **NextAuth.js** - 身份验证
- **Lucide React** - 图标

### 后端
- **Firebase Firestore** - NoSQL 数据库
- **Firebase Admin SDK** - 后端操作
- **Next.js API Routes** - RESTful API

### 工具
- **Python 3** - 数据导入和管理脚本
- **Pandas & openpyxl** - Excel 数据处理

---

## 🔐 权限系统

系统实现了基于角色的访问控制（RBAC）：

| 角色 | 访问权限 | 配置位置 |
|------|---------|---------|
| **Student** | 选课、查看自己的信息 | 默认角色 |
| **Admin** | 学生管理、审批、财务 | `src/lib/permissions.ts` → `ADMIN_EMAILS` |
| **IT** | 用户管理、系统配置 | `src/lib/permissions.ts` → `IT_EMAILS` |
| **Superadmin** | 所有权限 | `src/lib/permissions.ts` → `SUPERADMIN_EMAILS` |

详细使用方法见：[PERMISSIONS_GUIDE.md](./WEB_APP/PERMISSIONS_GUIDE.md)

---

## 💰 定价系统

课程价格根据**科目类别**和**支付方式**动态计算：

### 基础价格
- 文科课程：\$400
- 理科课程：\$550

### 支付方式手续费
| 方式 | 手续费 | 总价（文科） | 总价（理科） |
|------|-------|------------|------------|
| 信用卡 | 3.5% | \$414.00 | \$569.25 |
| 微信 | 3.0% | \$412.00 | \$566.50 |
| 支付宝 | 3.0% | \$412.00 | \$566.50 |
| EMT | 0% | \$400.00 | \$550.00 |
| 手动支付 | 0% | \$400.00 | \$550.00 |

---

## 📊 数据导入

使用 Python 脚本从 Excel 导入课程数据：

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 导入课程数据
python scripts/import_data.py
```

**Excel 文件格式**：`St Regis Online Courses Form.xlsx`

---

## 🛠️ 常用命令

### 前端开发
```bash
cd WEB_APP
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run type-check   # TypeScript 类型检查
```

### 数据管理
```bash
# 导入课程数据
python scripts/import_data.py

# 管理学生数据
python scripts/student_manager.py
```

---

## 📚 文档索引

| 文档 | 描述 |
|-----|------|
| [WEB_APP/README.md](./WEB_APP/README.md) | 前端应用详细文档 |
| [WEB_APP/PERMISSIONS_GUIDE.md](./WEB_APP/PERMISSIONS_GUIDE.md) | 权限系统使用指南 |
| [scripts/README.md](./scripts/README.md) | Python 脚本使用说明 |

---

## 🔒 环境变量配置

在 `WEB_APP/.env.local` 中配置以下变量：

```env
# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=borui-education
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@borui-education.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client (公开配置)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=borui-education.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=borui-education
NEXT_PUBLIC_FIREBASE_DATABASE_ID=studentapp

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

---

## ⚠️ 安全注意事项

1. **不要提交敏感文件**
   - ✅ 已在 `.gitignore` 中排除 `.env.local` 和 `*.json` 密钥文件
   
2. **定期更新依赖**
   ```bash
   npm update
   pip install --upgrade -r requirements.txt
   ```

3. **权限白名单**
   - 定期审查 `src/lib/permissions.ts` 中的邮箱白名单

---

## 🆘 故障排除

### 无法启动开发服务器
```bash
# 清除缓存
rm -rf .next node_modules
npm install
npm run dev
```

### 登录后角色不正确
1. 检查邮箱是否在 `src/lib/permissions.ts` 的白名单中
2. 退出登录后重新登录
3. 检查浏览器控制台的 session 数据

### Firestore 连接失败
1. 确认 `.env.local` 中的配置正确
2. 确认 Firestore 数据库 ID 为 `studentapp`
3. 检查 Firebase 服务账号权限

---

## 📈 系统状态

### 已完成功能
- ✅ 用户认证（Google OAuth + Email）
- ✅ 角色权限系统（4种角色）
- ✅ 课程管理（CRUD）
- ✅ 学生选课（购物车、限制4门）
- ✅ 财务管理（统计、欠费、收款）
- ✅ 定价引擎（动态计算）
- ✅ 数据导入（Excel → Firestore）
- ✅ 响应式导航栏（角色相关）
- ✅ 学生课程表格视图（名额、状态）

### 待开发功能
- ⏳ 支付网关集成（Stripe/微信/支付宝/EMT）
- ⏳ 邮件通知系统
- ⏳ 课程评价系统
- ⏳ 导出报表功能（Excel/PDF）
- ⏳ Cloud Functions（高并发处理）
- ⏳ 多语言支持（中英文切换）

---

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

此项目为内部使用，未开源。

---

## 📞 支持

如有问题或建议，请联系项目维护者。

**项目状态**: 🟢 生产就绪（核心功能完成）
