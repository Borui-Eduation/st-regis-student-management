# Resend 邮件域名配置指南

## 📧 提高邮件送达率 - 配置自定义域名

### 为什么需要配置自定义域名？

- ✅ 避免邮件进入垃圾箱
- ✅ 提高邮件送达率
- ✅ 增强品牌信任度
- ✅ 使用 `admin@borui.org` 而不是 `onboarding@resend.dev`

---

## 第一步：在 Resend 中添加域名

### 1.1 访问 Resend Dashboard

```
https://resend.com/domains
```

### 1.2 点击 "Add Domain"

### 1.3 输入域名

**推荐选项 A：使用子域名（推荐）**
```
mail.borui.org
```
- ✅ 更安全，不影响主域名
- ✅ 可以独立管理邮件配置
- ✅ 出问题时不影响主网站

**选项 B：使用主域名**
```
borui.org
```
- ⚠️ 会影响整个域名的邮件配置

### 1.4 Resend 会显示需要添加的 DNS 记录

Resend 会生成类似以下的记录（**具体值请以 Resend Dashboard 显示为准**）：

---

## 第二步：配置 DNS 记录

### 当前 DNS 状态

```bash
# 当前 SPF 记录
borui.org. IN TXT "v=spf1 mx ip4:216.232.48.177 ~all"

# 当前 MX 记录
borui.org. IN MX 10 mail.borui.org.
```

### 需要添加的记录（示例）

#### 2.1 SPF 记录（发件人策略框架）

**如果使用子域名 `mail.borui.org`：**
```
类型: TXT
主机: mail.borui.org
值: v=spf1 include:_spf.resend.com ~all
```

**如果使用主域名 `borui.org`：**
需要更新现有的 SPF 记录：
```
类型: TXT
主机: @
值: v=spf1 mx ip4:216.232.48.177 include:_spf.resend.com ~all
```

⚠️ **注意**：一个域名只能有一条 SPF 记录，需要合并现有记录！

#### 2.2 DKIM 记录（域名密钥识别邮件）

```
类型: TXT
主机: resend._domainkey.borui.org
值: [Resend 提供的长字符串，类似：]
     p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

#### 2.3 DMARC 记录（域名消息认证报告和符合性）

```
类型: TXT
主机: _dmarc.borui.org
值: v=DMARC1; p=none; rua=mailto:dmarc@borui.org
```

**DMARC 策略说明：**
- `p=none` - 监控模式（推荐首先使用）
- `p=quarantine` - 可疑邮件隔离
- `p=reject` - 拒绝未通过验证的邮件

---

## 第三步：在 DNS 提供商处添加记录

### 3.1 确定您的 DNS 提供商

检查 `borui.org` 的名称服务器：

```bash
host -t NS borui.org
```

常见 DNS 提供商：
- Cloudflare
- Namecheap
- GoDaddy
- AWS Route53
- Google Domains

### 3.2 登录 DNS 管理面板

根据您的 DNS 提供商，登录到管理面板。

### 3.3 添加 DNS 记录

按照 Resend Dashboard 中显示的具体值添加记录。

**重要提示：**
- ✅ 完全复制粘贴 Resend 提供的值
- ✅ 不要添加额外的引号
- ✅ 确保没有拼写错误
- ✅ TTL 可以设置为 3600（1小时）或更低

---

## 第四步：验证域名

### 4.1 等待 DNS 传播

- DNS 记录通常需要 **5-30 分钟**传播
- 有时可能需要最多 **24-48 小时**

### 4.2 检查 DNS 记录是否生效

```bash
# 检查 SPF
host -t TXT mail.borui.org

# 检查 DKIM
host -t TXT resend._domainkey.borui.org

# 检查 DMARC
host -t TXT _dmarc.borui.org
```

### 4.3 在 Resend 中点击 "Verify"

返回 Resend Dashboard，点击域名旁边的 "Verify" 按钮。

✅ 验证成功后，状态会变为 "Verified"

---

## 第五步：更新应用配置

### 5.1 更新环境变量

编辑 `.env` 文件：

```bash
# 更新发件人邮箱
RESEND_FROM_EMAIL=noreply@mail.borui.org
# 或
RESEND_FROM_EMAIL=admin@borui.org
```

### 5.2 重新部署应用

```bash
cd /home/borui/apps/st-regis-student-management
docker-compose up -d --build
```

---

## 第六步：测试邮件发送

### 6.1 发送测试邮件

访问您的应用并尝试发送登录邮件。

### 6.2 检查邮件头

收到邮件后，查看邮件头（Email Headers）：

- ✅ `SPF: PASS`
- ✅ `DKIM: PASS`
- ✅ `DMARC: PASS`

### 6.3 使用邮件测试工具

访问以下网站测试邮件配置：

- https://www.mail-tester.com/
- https://mxtoolbox.com/SuperTool.aspx

---

## 常见问题排查

### 问题 1：DNS 记录未生效

**解决方案：**
```bash
# 清除本地 DNS 缓存（Mac/Linux）
sudo killall -HUP mDNSResponder

# 使用 Google DNS 查询
host -t TXT mail.borui.org 8.8.8.8
```

### 问题 2：SPF 记录冲突

如果已有 SPF 记录，需要合并：

**错误做法：**
```
v=spf1 mx ~all
v=spf1 include:_spf.resend.com ~all  ❌ 不能有两条
```

**正确做法：**
```
v=spf1 mx include:_spf.resend.com ~all  ✅ 合并为一条
```

### 问题 3：邮件仍然进垃圾箱

**可能原因：**
- DNS 记录刚添加，需要时间建立信誉
- 发件频率过高
- 邮件内容被判定为垃圾

**解决方案：**
- 等待 1-2 周建立发件信誉
- 确保邮件内容质量高
- 添加退订链接
- 使用专业的邮件模板

---

## 监控和维护

### 定期检查

1. **每月检查一次** DMARC 报告
2. **监控邮件送达率**
3. **关注 Resend Dashboard 的统计数据**

### DMARC 报告

如果在 DMARC 记录中设置了 `rua=mailto:dmarc@borui.org`，
您会收到域名的 DMARC 报告，可以了解邮件认证情况。

---

## 快速参考

### DNS 记录模板（请以 Resend 实际提供为准）

| 类型 | 主机 | 值 |
|------|------|-----|
| TXT | mail.borui.org | v=spf1 include:_spf.resend.com ~all |
| TXT | resend._domainkey.mail.borui.org | [Resend 提供的 DKIM 公钥] |
| TXT | _dmarc.mail.borui.org | v=DMARC1; p=none; rua=mailto:dmarc@borui.org |

### 有用的命令

```bash
# 检查所有邮件相关记录
dig @8.8.8.8 mail.borui.org TXT +short
dig @8.8.8.8 resend._domainkey.mail.borui.org TXT +short
dig @8.8.8.8 _dmarc.mail.borui.org TXT +short

# 测试邮件服务器
telnet mail.borui.org 25
```

---

## 需要帮助？

- Resend 文档：https://resend.com/docs/dashboard/domains/introduction
- SPF 检查工具：https://www.kitterman.com/spf/validate.html
- DKIM 检查工具：https://dkimvalidator.com/
- DMARC 检查工具：https://dmarc.org/resources/deployment-tools/

---

## ✅ 配置完成检查清单

- [ ] 在 Resend 中添加域名
- [ ] 添加 SPF 记录到 DNS
- [ ] 添加 DKIM 记录到 DNS
- [ ] 添加 DMARC 记录到 DNS
- [ ] 等待 DNS 传播（5-30分钟）
- [ ] 在 Resend 中验证域名
- [ ] 更新应用的 RESEND_FROM_EMAIL
- [ ] 重新部署应用
- [ ] 发送测试邮件
- [ ] 检查邮件头确认 SPF/DKIM/DMARC 通过
- [ ] 使用 mail-tester.com 测试邮件得分

---

**预期结果：** 邮件送达率提高到 95%+，不再进入垃圾箱！


