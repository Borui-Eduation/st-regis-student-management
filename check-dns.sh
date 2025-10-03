#!/bin/bash

# DNS 记录检查脚本
# 用于验证 Resend 邮件域名配置

# 修改为您在 Resend 中配置的域名
# 推荐使用子域名，避免与现有邮件服务器冲突
DOMAIN="${1:-app.borui.org}"  # 默认: app.borui.org，也可以通过参数指定

echo "================================================"
echo "邮件域名 DNS 配置检查工具"
echo "================================================"
echo ""
echo "检查域名: $DOMAIN"
echo ""

# 检查 SPF 记录
echo "1️⃣  检查 SPF 记录..."
echo "---"
SPF=$(dig @8.8.8.8 $DOMAIN TXT +short | grep "v=spf1")
if [ -z "$SPF" ]; then
    echo "❌ 未找到 SPF 记录"
else
    echo "✅ SPF 记录已配置:"
    echo "$SPF"
    if [[ $SPF == *"include:_spf.resend.com"* ]]; then
        echo "✅ 包含 Resend SPF"
    else
        echo "⚠️  未包含 Resend SPF (include:_spf.resend.com)"
    fi
fi
echo ""

# 检查 DKIM 记录
echo "2️⃣  检查 DKIM 记录..."
echo "---"
DKIM=$(dig @8.8.8.8 resend._domainkey.$DOMAIN TXT +short)
if [ -z "$DKIM" ]; then
    echo "❌ 未找到 DKIM 记录"
    echo "   应配置: resend._domainkey.$DOMAIN"
else
    echo "✅ DKIM 记录已配置"
    echo "${DKIM:0:60}..."
fi
echo ""

# 检查 DMARC 记录
echo "3️⃣  检查 DMARC 记录..."
echo "---"
DMARC=$(dig @8.8.8.8 _dmarc.$DOMAIN TXT +short)
if [ -z "$DMARC" ]; then
    echo "❌ 未找到 DMARC 记录"
    echo "   应配置: _dmarc.$DOMAIN"
    echo "   推荐值: v=DMARC1; p=none; rua=mailto:dmarc@borui.org"
else
    echo "✅ DMARC 记录已配置:"
    echo "$DMARC"
fi
echo ""

# 总结
echo "================================================"
echo "📊 配置状态总结"
echo "================================================"

HAS_SPF=false
HAS_DKIM=false
HAS_DMARC=false
HAS_RESEND_SPF=false

[ ! -z "$SPF" ] && HAS_SPF=true
[ ! -z "$DKIM" ] && HAS_DKIM=true
[ ! -z "$DMARC" ] && HAS_DMARC=true
[[ $SPF == *"include:_spf.resend.com"* ]] && HAS_RESEND_SPF=true

if $HAS_SPF && $HAS_RESEND_SPF && $HAS_DKIM && $HAS_DMARC; then
    echo "✅ 所有记录配置完成！"
    echo ""
    echo "下一步:"
    echo "1. 在 Resend Dashboard 中点击 'Verify' 验证域名"
    echo "2. 更新 .env 文件中的 RESEND_FROM_EMAIL"
    echo "3. 重新部署应用: docker-compose up -d --build"
    echo "4. 发送测试邮件"
elif $HAS_SPF || $HAS_DKIM || $HAS_DMARC; then
    echo "⚠️  部分记录已配置，但尚未完成"
    echo ""
    echo "缺少的记录:"
    ! $HAS_SPF && echo "  - SPF"
    ! $HAS_RESEND_SPF && echo "  - SPF 中的 Resend include"
    ! $HAS_DKIM && echo "  - DKIM"
    ! $HAS_DMARC && echo "  - DMARC"
    echo ""
    echo "请查看 RESEND_SETUP.md 了解如何添加这些记录"
else
    echo "❌ 尚未配置任何邮件记录"
    echo ""
    echo "请按照以下步骤操作:"
    echo "1. 阅读 RESEND_SETUP.md"
    echo "2. 在 Resend 中添加域名: $DOMAIN"
    echo "3. 复制 Resend 提供的 DNS 记录"
    echo "4. 在 DNS 提供商处添加这些记录"
    echo "5. 等待 5-30 分钟 DNS 传播"
    echo "6. 再次运行此脚本检查"
fi

echo ""
echo "================================================"
echo "🔗 有用的链接"
echo "================================================"
echo "- Resend Dashboard: https://resend.com/domains"
echo "- Mail Tester: https://www.mail-tester.com/"
echo "- MXToolbox: https://mxtoolbox.com/SuperTool.aspx"
echo "- SPF 验证: https://www.kitterman.com/spf/validate.html"
echo ""

