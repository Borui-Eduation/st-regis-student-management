#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 API优化测试脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="http://localhost:3000"

echo "📝 测试说明："
echo "  1. 确保 npm run dev 正在运行"
echo "  2. 已登录管理员账号"
echo "  3. 观察控制台日志中的缓存命中情况"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试1: Stats API
echo "🧪 测试 1: /api/admin/stats (缓存测试)"
echo "  第一次请求（应该查询Firestore）..."
curl -s "$BASE_URL/api/admin/stats" -H "Cookie: next-auth.session-token=YOUR_TOKEN" | jq '.data.enrollments.total' > /dev/null
sleep 1

echo "  第二次请求（应该命中缓存）..."
curl -s "$BASE_URL/api/admin/stats" -H "Cookie: next-auth.session-token=YOUR_TOKEN" | jq '.data.enrollments.total' > /dev/null
echo "  ✅ Stats API测试完成"
echo ""

# 测试2: Finance Stats API
echo "🧪 测试 2: /api/admin/finance/stats (缓存测试)"
echo "  第一次请求（应该查询Firestore）..."
curl -s "$BASE_URL/api/admin/finance/stats" -H "Cookie: next-auth.session-token=YOUR_TOKEN" | jq '.data.overview.totalRevenue' > /dev/null
sleep 1

echo "  第二次请求（应该命中缓存）..."
curl -s "$BASE_URL/api/admin/finance/stats" -H "Cookie: next-auth.session-token=YOUR_TOKEN" | jq '.data.overview.totalRevenue' > /dev/null
echo "  ✅ Finance Stats API测试完成"
echo ""

# 测试3: Students by Status
echo "🧪 测试 3: /api/admin/students/by-status (批量查询测试)"
curl -s "$BASE_URL/api/admin/students/by-status?status=open" -H "Cookie: next-auth.session-token=YOUR_TOKEN" | jq '.data | length' > /dev/null
echo "  ✅ Students by Status API测试完成"
echo ""

# 测试4: Health Check
echo "🧪 测试 4: /api/health (健康检查)"
HEALTH=$(curl -s "$BASE_URL/api/health" | jq -r '.status')
if [ "$HEALTH" = "ok" ]; then
  echo "  ✅ 服务健康"
else
  echo "  ❌ 服务异常"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 所有API测试完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 请检查 npm run dev 控制台日志："
echo "  • 查找 '📊 从Firestore查询' - 首次请求"
echo "  • 查找 '✅ L1缓存命中' 或 '✅ L2缓存命中' - 后续请求"
echo "  • 缓存命中率应 >80%"
echo ""
echo "💡 提示："
echo "  如果需要清除缓存，重启 npm run dev"
echo ""
