# Resend + Cloudflare + 现有邮件服务器配置指南

## 🏗️ 您的当前配置

```
域名: borui.org
DNS 管理: Cloudflare
现有邮件服务器: mail.borui.org (216.232.48.177)
现有 SPF: v=spf1 mx ip4:216.232.48.177 ~all
```

## ⚠️ 重要提示

由于您已有自建邮件服务器，我们**不能**直接修改主域名的邮件配置。
必须使用**专用子域名**来避免冲突。

---

## 🎯 推荐方案：使用专用子域名

### 方案选择

| 子域名 | 发件地址示例 | 推荐度 |
|--------|------------|-------|
| app.borui.org | noreply@app.borui.org | ⭐⭐⭐⭐⭐ |
| notify.borui.org | noreply@notify.borui.org | ⭐⭐⭐⭐ |
| system.borui.org | noreply@system.borui.org | ⭐⭐⭐⭐ |

**以下以 `app.borui.org` 为例**

---

## 第一步：在 Resend 中添加子域名

### 1.1 访问 Resend Dashboard

```
https://resend.com/domains
```

### 1.2 添加域名

点击 **"Add Domain"**，输入：
```
app.borui.org
```

### 1.3 获取 DNS 记录

Resend 会显示需要添加的 DNS 记录，**记录下这些值**：

```
SPF 记录：
主机: app.borui.org
值: v=spf1 include:_spf.resend.com ~all

DKIM 记录：
主机: resend._domainkey.app.borui.org
值: p=MIGfMA0GCSqGSIb... (长字符串)

DMARC 记录：
主机: _dmarc.app.borui.org
值: v=DMARC1; p=none; rua=mailto:dmarc@borui.org
```

---

## 第二步：在 Cloudflare 中添加 DNS 记录

### 2.1 登录 Cloudflare

1. 访问：https://dash.cloudflare.com/
2. 选择 `borui.org` 域名
3. 进入 **DNS** 页面

### 2.2 添加 SPF 记录

```
类型: TXT
名称: app.borui.org
内容: v=spf1 include:_spf.resend.com ~all
TTL: Auto
代理状态: 仅 DNS（灰色云朵）
```

**重要：** 点击云朵图标，确保是**灰色**（DNS only），不要使用橙色云朵（代理）！

### 2.3 添加 DKIM 记录

```
类型: TXT
名称: resend._domainkey.app.borui.org
内容: [复制 Resend 提供的完整 DKIM 值]
TTL: Auto
代理状态: 仅 DNS（灰色云朵）
```

**提示：** DKIM 值很长，确保完整复制。

### 2.4 添加 DMARC 记录

```
类型: TXT
名称: _dmarc.app.borui.org
内容: v=DMARC1; p=none; rua=mailto:dmarc@borui.org
TTL: Auto
代理状态: 仅 DNS（灰色云朵）
```

---

## 第三步：验证配置

### 3.1 等待 DNS 传播

Cloudflare DNS 通常**5-10 分钟**即可生效。

### 3.2 使用检查工具

运行检查脚本（已更新为检查 app.borui.org）：

```bash
cd /home/borui/apps/st-regis-student-management
./check-dns.sh
```

或手动检查：

```bash
# 检查 SPF
dig @1.1.1.1 app.borui.org TXT +short

# 检查 DKIM
dig @1.1.1.1 resend._domainkey.app.borui.org TXT +short

# 检查 DMARC
dig @1.1.1.1 _dmarc.app.borui.org TXT +short
```

### 3.3 在 Resend 中验证

1. 返回 Resend Dashboard
2. 找到 `app.borui.org`
3. 点击 **"Verify"** 按钮
4. 等待验证成功（状态变为 ✅ Verified）

---

## 第四步：更新应用配置

### 4.1 更新环境变量

编辑 `.env` 文件：

```bash
cd /home/borui/apps/st-regis-student-management
nano WEB_APP/.env
```

修改发件邮箱：

```bash
# 原来
RESEND_FROM_EMAIL=admin@borui.org

# 改为
RESEND_FROM_EMAIL=noreply@app.borui.org
```

或者使用更友好的名称：

```bash
RESEND_FROM_EMAIL=St Regis System <noreply@app.borui.org>
```

### 4.2 重新部署应用

```bash
docker-compose up -d --build
```

### 4.3 测试发送邮件

1. 访问 https://stregis.borui.org
2. 尝试邮件登录
3. 检查邮件是否到达收件箱（而不是垃圾箱）

---

## 🔍 验证邮件配置

### 方法 1：使用 Mail Tester

1. 访问：https://www.mail-tester.com/
2. 获取测试邮箱地址（如：test-abc123@srv1.mail-tester.com）
3. 在您的应用中向该地址发送邮件
4. 刷新 Mail Tester 页面查看得分

**目标得分：9/10 或 10/10**

### 方法 2：检查邮件头

收到邮件后，查看邮件原始内容（Email Headers）：

```
✅ SPF: PASS
✅ DKIM: PASS
✅ DMARC: PASS
```

---

## 📊 Cloudflare DNS 记录总览

配置完成后，您的 Cloudflare DNS 应该有：

### 现有记录（保持不变）

```
类型: MX
名称: borui.org
内容: mail.borui.org
优先级: 10

类型: TXT
名称: borui.org
内容: v=spf1 mx ip4:216.232.48.177 ~all
```

### 新增记录（应用邮件）

```
类型: TXT
名称: app.borui.org
内容: v=spf1 include:_spf.resend.com ~all
代理: 仅 DNS

类型: TXT
名称: resend._domainkey.app.borui.org
内容: p=MIGfMA0GCSqGSIb...
代理: 仅 DNS

类型: TXT
名称: _dmarc.app.borui.org
内容: v=DMARC1; p=none; rua=mailto:dmarc@borui.org
代理: 仅 DNS
```

**结果：** 两套邮件系统完全独立！

---

## 🎨 Cloudflare 截图指南

### 添加 TXT 记录的正确方式

```
┌─────────────────────────────────────────────────┐
│ Add DNS record                                  │
├─────────────────────────────────────────────────┤
│ Type: TXT                                       │
│ Name: app.borui.org                            │
│ Content: v=spf1 include:_spf.resend.com ~all   │
│ TTL: Auto                                       │
│ Proxy status: [灰色云朵] DNS only              │
│                                                 │
│ [Cancel]  [Save]                               │
└─────────────────────────────────────────────────┘
```

**关键点：**
- ✅ 名称使用完整域名（如 `app.borui.org`）或仅子域名（如 `app`）
- ✅ 内容完整复制，不要添加引号
- ✅ 代理状态必须是**灰色云朵**（DNS only）

---

## ⚠️ 常见错误

### 错误 1：使用橙色云朵代理

```
❌ 代理状态: [橙色云朵] Proxied
```

**问题：** 邮件验证记录不能通过 Cloudflare 代理
**解决：** 点击云朵图标，改为灰色（DNS only）

### 错误 2：修改主域名 SPF

```
❌ 修改 borui.org 的 SPF 记录
```

**问题：** 会影响现有邮件服务器
**解决：** 使用子域名（app.borui.org），不要动主域名

### 错误 3：DKIM 记录不完整

```
❌ 内容: p=MIGfMA0GCSqGSIb... (省略了后面部分)
```

**问题：** DKIM 验证失败
**解决：** 确保复制完整的 DKIM 值（可能很长）

---

## 🔧 故障排查

### 问题 1：Resend 验证失败

**症状：** Resend 显示 "Verification failed"

**检查步骤：**
```bash
# 1. 检查 DNS 记录是否生效
dig @1.1.1.1 app.borui.org TXT +short

# 2. 检查是否使用了代理
# 在 Cloudflare 中查看记录，确保是灰色云朵

# 3. 等待更长时间
# 有时需要 30 分钟甚至更久

# 4. 清除 Cloudflare 缓存
# Cloudflare Dashboard → Caching → Purge Everything
```

### 问题 2：邮件仍进垃圾箱

**可能原因：**
- DNS 记录刚配置，需要建立发件信誉（1-2周）
- 邮件内容质量问题
- 收件人之前标记过类似邮件为垃圾

**临时解决：**
1. 将 `noreply@app.borui.org` 添加到联系人
2. 在垃圾箱中标记为"不是垃圾邮件"
3. 等待发件信誉建立

### 问题 3：现有邮件服务器受影响

**症状：** 自建邮件服务器无法正常收发邮件

**检查：**
```bash
# 确认主域名 SPF 未被修改
dig @1.1.1.1 borui.org TXT +short | grep spf

# 应该显示：
# "v=spf1 mx ip4:216.232.48.177 ~all"

# 如果不是，立即在 Cloudflare 中恢复原始记录
```

---

## ✅ 配置完成检查清单

- [ ] 在 Resend 中添加子域名（app.borui.org）
- [ ] 在 Cloudflare 中添加 SPF 记录（灰色云朵）
- [ ] 在 Cloudflare 中添加 DKIM 记录（灰色云朵）
- [ ] 在 Cloudflare 中添加 DMARC 记录（灰色云朵）
- [ ] 等待 5-10 分钟 DNS 传播
- [ ] 运行 `./check-dns.sh` 验证配置
- [ ] 在 Resend 中点击 Verify，确认验证成功
- [ ] 更新 `.env` 文件中的 `RESEND_FROM_EMAIL`
- [ ] 重新部署应用 `docker-compose up -d --build`
- [ ] 发送测试邮件
- [ ] 使用 Mail Tester 测试邮件得分（目标 9/10+）
- [ ] 确认现有邮件服务器未受影响

---

## 🔗 有用的链接

### Cloudflare
- Dashboard: https://dash.cloudflare.com/
- DNS 文档: https://developers.cloudflare.com/dns/

### Resend
- Dashboard: https://resend.com/domains
- 文档: https://resend.com/docs/dashboard/domains/introduction

### 测试工具
- Mail Tester: https://www.mail-tester.com/
- MXToolbox: https://mxtoolbox.com/SuperTool.aspx
- DNS Propagation: https://dnschecker.org/

---

## 📞 获取帮助

如果遇到问题：

1. **查看 Cloudflare Logs**
   - Dashboard → Analytics → Logs

2. **检查 Resend 状态**
   - Dashboard → Domains → 查看域名状态

3. **测试 DNS 解析**
   ```bash
   ./check-dns.sh
   ```

4. **Cloudflare 社区**
   - https://community.cloudflare.com/

---

## 🎯 最终效果

配置完成后：

### 应用邮件（新配置）
```
发件人: noreply@app.borui.org
通过: Resend
状态: ✅ 直达收件箱
用途: 应用登录链接、通知等
```

### 自建邮件（保持不变）
```
域名: borui.org / mail.borui.org
服务器: 216.232.48.177
状态: ✅ 正常运行
用途: 公司邮件、个人邮箱等
```

**两套系统完全独立，互不干扰！** ✅




