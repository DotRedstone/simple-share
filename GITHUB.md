# 上传 SimpleShare 到 GitHub

本指南将帮助你将 SimpleShare 项目上传到 GitHub。

## 📋 前置要求

1. 已安装 Git
2. 已注册 GitHub 账号
3. 已配置 Git 用户信息（如果还没有）

## 🚀 快速步骤

### 步骤 1: 初始化 Git 仓库

```bash
# 在项目根目录执行
cd SimpleShare

# 初始化 Git 仓库
git init

# 配置用户信息（如果还没有配置）
git config user.name "你的名字"
git config user.email "你的邮箱"
```

### 步骤 2: 创建 .gitignore（已存在）

项目已包含 `.gitignore` 文件，会自动忽略：
- `node_modules/`
- `dist/`
- `.env` 文件
- 其他不需要版本控制的文件

### 步骤 3: 添加文件到 Git

```bash
# 添加所有文件
git add .

# 查看将要提交的文件
git status
```

### 步骤 4: 创建首次提交

```bash
git commit -m "Initial commit: SimpleShare - 文件传输与分享平台"
```

### 步骤 5: 在 GitHub 创建仓库

1. 登录 GitHub
2. 点击右上角的 **+** → **New repository**
3. 填写仓库信息：
   - **Repository name**: `SimpleShare` 或 `simple-share`
   - **Description**: `一个安全、极速的文件传输与分享平台，基于 Vue 3 + Cloudflare Pages Functions 构建`
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
4. 点击 **Create repository**

### 步骤 6: 连接本地仓库到 GitHub

GitHub 会显示仓库的 URL，类似：
- HTTPS: `https://github.com/你的用户名/SimpleShare.git`
- SSH: `git@github.com:你的用户名/SimpleShare.git`

```bash
# 添加远程仓库（使用 HTTPS）
git remote add origin https://github.com/你的用户名/SimpleShare.git

# 或者使用 SSH（如果已配置 SSH 密钥）
# git remote add origin git@github.com:你的用户名/SimpleShare.git

# 验证远程仓库
git remote -v
```

### 步骤 7: 推送代码到 GitHub

```bash
# 推送代码到 GitHub（首次推送）
git push -u origin main

# 如果默认分支是 master，使用：
# git push -u origin master
```

如果遇到分支名称问题，可以重命名：

```bash
# 重命名分支为 main（如果当前是 master）
git branch -M main

# 然后推送
git push -u origin main
```

## 🔐 认证方式

### 方式一：使用 Personal Access Token（推荐）

1. 在 GitHub 设置中创建 Personal Access Token：
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 点击 "Generate new token (classic)"
   - 选择权限：至少勾选 `repo`
   - 复制生成的 token

2. 推送时使用 token 作为密码：
   ```bash
   # 当提示输入密码时，使用 token 而不是 GitHub 密码
   git push -u origin main
   ```

### 方式二：使用 SSH 密钥

1. 生成 SSH 密钥（如果还没有）：
   ```bash
   ssh-keygen -t ed25519 -C "你的邮箱"
   ```

2. 将公钥添加到 GitHub：
   ```bash
   # 复制公钥内容
   cat ~/.ssh/id_ed25519.pub
   ```
   
   然后到 GitHub → Settings → SSH and GPG keys → New SSH key，粘贴公钥

3. 使用 SSH URL 添加远程仓库：
   ```bash
   git remote set-url origin git@github.com:你的用户名/SimpleShare.git
   ```

## 📝 后续更新

以后每次修改代码后，使用以下命令更新 GitHub：

```bash
# 查看修改的文件
git status

# 添加修改的文件
git add .

# 或者添加特定文件
git add 文件名

# 提交修改
git commit -m "描述你的修改"

# 推送到 GitHub
git push
```

## 🏷️ 添加标签和发布

### 创建标签

```bash
# 创建标签
git tag -a v1.0.0 -m "SimpleShare v1.0.0 - 初始版本"

# 推送标签到 GitHub
git push origin v1.0.0
```

### 在 GitHub 创建 Release

1. 进入仓库页面
2. 点击 **Releases** → **Create a new release**
3. 选择标签，填写发布说明
4. 点击 **Publish release**

## 📚 推荐的仓库设置

### 添加仓库描述和主题

在 GitHub 仓库页面：
- 点击 **Settings** → 添加仓库描述
- 添加主题标签（Topics）：`vue3`, `typescript`, `cloudflare`, `file-sharing`, `serverless`

### 添加 README 徽章（可选）

在 `README.md` 顶部添加：

```markdown
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)
```

## 🐛 常见问题

### 问题 1: 推送被拒绝

**错误**: `error: failed to push some refs`

**解决方案**:
```bash
# 先拉取远程更改
git pull origin main --rebase

# 然后再次推送
git push -u origin main
```

### 问题 2: 认证失败

**错误**: `Authentication failed`

**解决方案**:
- 检查用户名和密码（或 token）是否正确
- 如果使用 HTTPS，考虑切换到 SSH
- 清除保存的凭据：`git credential-cache exit`

### 问题 3: 分支名称不匹配

**错误**: `refusing to merge unrelated histories`

**解决方案**:
```bash
# 允许合并不相关的历史
git pull origin main --allow-unrelated-histories
```

## 📖 更多资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 帮助文档](https://docs.github.com/)
- [GitHub CLI](https://cli.github.com/) - 命令行工具

## ✅ 检查清单

上传前确保：

- [ ] 已删除敏感信息（API 密钥、密码等）
- [ ] `.gitignore` 已正确配置
- [ ] `README.md` 已更新
- [ ] 代码已测试
- [ ] 提交信息清晰明确
- [ ] 已添加必要的文档

完成！你的 SimpleShare 项目现在已经在 GitHub 上了！🎉

