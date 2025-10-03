# 🔧 GitHub MCP Server 配置指南

## ✅ 安装状态
- **版本**: 0.17.1
- **安装路径**: `~/.local/bin/github-mcp-server`
- **配置文件**: `~/.cursor/mcp_config.json`
- **GitHub 用户**: YaoS-Code
- **配置状态**: ✅ 已完成并测试通过
- **Token 权限**: 完整访问权限（repo, admin:org, workflow, copilot 等）

---

## 🔑 下一步：配置 GitHub Token

### 1. 创建 GitHub Personal Access Token

访问: https://github.com/settings/tokens/new

**推荐权限** (classic token):
- `repo` - 完整仓库访问权限
- `read:org` - 读取组织信息
- `read:user` - 读取用户信息
- `user:email` - 读取用户邮箱

或者使用 **Fine-grained token** (更安全):
- Repository access: 选择您需要访问的仓库
- Permissions:
  - Contents: Read and write
  - Issues: Read and write
  - Pull requests: Read and write
  - Metadata: Read-only

### 2. 配置 Token

编辑配置文件:
```bash
nano ~/.cursor/mcp_config.json
```

将您的 token 填入 `GITHUB_PERSONAL_ACCESS_TOKEN`:
```json
{
  "mcpServers": {
    "github": {
      "command": "/Users/yao/.local/bin/github-mcp-server",
      "args": [],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### 3. 重启 Cursor

完全退出 Cursor 并重新启动以加载 MCP 配置。

---

## 🎯 可用功能

安装后，您可以在 Cursor 中使用以下 GitHub 功能：

### 仓库管理
- 创建、搜索、查看仓库
- 创建和管理分支
- 推送文件和提交

### Issue 管理
- 创建、搜索、更新 Issues
- 添加评论
- 管理标签

### Pull Request
- 创建、搜索、合并 PR
- 添加评论和审核
- 查看 PR 状态

### Actions & CI/CD
- 查看 workflow 运行状态
- 触发 workflow
- 查看日志

### 代码安全
- 查看安全告警
- Dependabot 管理
- 代码扫描结果

---

## 🔧 高级配置

### 指定 Toolsets（可选）

如果您只需要特定功能，可以限制可用的工具集：

```json
{
  "mcpServers": {
    "github": {
      "command": "/Users/yao/.local/bin/github-mcp-server",
      "args": ["--toolsets", "repos,issues,pull_requests"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**可用 Toolsets**:
- `repos` - 仓库管理
- `issues` - Issue 管理
- `pull_requests` - PR 管理
- `actions` - GitHub Actions
- `code_security` - 代码安全
- `users` - 用户搜索
- `all` - 所有功能

### 只读模式（可选）

如果您只需要读取权限，可以启用只读模式：

```json
{
  "mcpServers": {
    "github": {
      "command": "/Users/yao/.local/bin/github-mcp-server",
      "args": ["--read-only"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

---

## ✅ 验证安装

重启 Cursor 后，在 Cursor 中询问：
> "能否帮我查看这个项目的 GitHub 仓库信息？"

如果配置正确，Cursor 将能够访问 GitHub API。

---

## 🆘 故障排除

### MCP Server 未连接
1. 检查 token 是否正确填写
2. 完全退出并重启 Cursor
3. 查看 Cursor 日志: `~/Library/Logs/Cursor/`

### 权限错误
- 确保 token 有足够的权限
- 检查 token 是否过期

### 无法找到命令
```bash
# 验证文件存在
ls -la ~/.local/bin/github-mcp-server

# 验证可执行
~/.local/bin/github-mcp-server --version
```

---

## 📚 更多信息

- [GitHub MCP Server 官方文档](https://github.com/github/github-mcp-server)
- [MCP Protocol 文档](https://modelcontextprotocol.io/)

**安装日期**: 2025-10-03



