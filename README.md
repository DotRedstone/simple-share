# SimpleShare

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)

一个安全、极速的文件传输与分享平台，基于 Vue 3 + TypeScript + Cloudflare Pages Functions 构建。

> 🌟 **Star 这个项目** 如果你觉得它有用！

## 🚀 快速部署

### ⚡ 一键部署到 Cloudflare Pages

点击下面的按钮，一键将项目部署到 Cloudflare Pages！

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/DotRedstone/simple-share) 

### 方式一：通过 Cloudflare Dashboard 部署（推荐）

1. **Fork 此仓库**到你的 GitHub 账号
   - 点击 GitHub 右上角的 **Fork** 按钮

2. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 **Pages** → **Create a project**

3. **连接 GitHub 仓库**
   - 选择 **Connect to Git**
   - 授权 Cloudflare 访问你的 GitHub
   - 选择你 Fork 的 `simple-share` 仓库

4. **配置构建设置**
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`（项目根目录）
   - **Node.js version**: `20` 或更高版本（重要！项目需要 Node.js 20+）
     - 在 **Settings** → **Builds & deployments** → **Environment variables** 中添加：
       - `NODE_VERSION`: `20`（或更高版本）
   - ⚠️ **重要**：**不要设置部署命令（Deploy command）**，留空即可！Cloudflare Pages 会自动部署 `dist` 目录和其中的 `functions` 目录
   - 🚨 **如果已经设置了部署命令导致错误**：在 **Deploy command** 字段中删除 `npx wrangler deploy`，或者临时替换为 `node scripts/noop-deploy.js`（但最终应该删除）

5. **配置环境变量和绑定**
   - 在 **Settings** → **Environment Variables** 中添加：
     - `JWT_SECRET`: 你的 JWT 密钥（至少 32 字符的随机字符串）
   - 在 **Settings** → **Functions** → **D1 Database bindings** 中绑定 D1 数据库
   - 在 **Settings** → **Functions** → **R2 Bucket bindings** 中绑定 R2 存储桶

6. **创建 Cloudflare 资源**
   ```bash
   # 创建 D1 数据库
   npx wrangler d1 create simpleshare-db
   
   # 创建 R2 存储桶
   npx wrangler r2 bucket create simpleshare-files
   ```

7. **初始化数据库**
   ```bash
   npx wrangler d1 execute simpleshare-db --file=./server/src/db/schema.sql
   ```

8. **部署**
   - 点击 **Save and Deploy**
   - 等待构建完成即可访问你的应用！
   - ⚠️ **如果遇到部署错误**：检查 **Settings** → **Builds & deployments** → **Deploy command** 是否为空，如果设置了 `npx wrangler deploy` 等命令，请删除它！Cloudflare Pages 会自动部署 `dist` 目录，不需要额外的部署命令。
   - 📖 **详细说明**：如果仍然遇到问题，请查看 [CLOUDFLARE_PAGES_SETUP.md](./CLOUDFLARE_PAGES_SETUP.md) 获取详细的故障排除指南。

### 方式二：使用 Wrangler CLI 部署

详见下方 [📋 部署到 Cloudflare Pages](#-部署到-cloudflare-pages) 章节。

## ✨ 功能特性

### 用户功能
- 🔒 **安全认证** - JWT 身份验证，密码加密存储
- 📁 **文件管理** - 上传、下载、删除、重命名、收藏文件
- 📂 **文件夹系统** - 创建文件夹，组织文件结构
- 🔗 **文件分享** - 生成提取码，设置有效期，分享文件
- 📊 **个人仪表盘** - 查看文件列表、最近文件、收藏文件
- 🔍 **搜索功能** - 快速搜索文件

### 管理员功能
- 👥 **用户管理** - 添加、编辑、删除用户，分配存储配额
- 👨‍👩‍👧‍👦 **用户组管理** - 创建用户组，设置组存储配额
- 📈 **存储管理** - 查看系统存储统计，配置 R2 存储
- 📋 **系统日志** - 查看系统操作日志
- 📁 **文件管理** - 查看所有用户文件，管理文件

### 访客功能
- 🔑 **提取文件** - 使用提取码提取分享的文件

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Tailwind CSS** - 实用优先的 CSS 框架

### 后端
- **Cloudflare Pages Functions** - Serverless API 路由
- **Cloudflare D1** - SQLite 数据库（元数据存储）
- **Cloudflare R2** - 对象存储（文件实体）
- **JWT** - 身份认证
- **TypeScript** - 类型安全

## 📦 项目结构

```
SimpleShare/
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   ├── views/              # 页面视图
│   ├── stores/             # Pinia 状态管理
│   ├── router/             # 路由配置
│   ├── api/                # API 客户端
│   └── types/              # TypeScript 类型定义
├── server/                 # 后端源码
│   ├── functions/          # Cloudflare Pages Functions
│   │   └── api/           # API 路由
│   ├── src/                # 后端工具和中间件
│   │   ├── utils/          # 工具函数
│   │   ├── middleware/     # 中间件
│   │   └── db/             # 数据库 Schema
│   └── wrangler.toml       # Cloudflare 配置
├── dist/                   # 构建输出
└── package.json            # 前端依赖
```

## 🚀 快速开始

### 本地开发

#### 1. 克隆项目

```bash
git clone <repository-url>
cd SimpleShare
```

#### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

#### 3. 配置 Cloudflare

在 `server/wrangler.toml` 中配置：

```toml
[[d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "your-database-id"  # 需要创建 D1 数据库后获取

[[r2_buckets]]
binding = "FILES"
bucket_name = "simpleshare-files"  # 需要创建 R2 存储桶

[vars]
JWT_SECRET = "your-jwt-secret-key"  # 生产环境使用强随机字符串
```

#### 4. 创建 Cloudflare 资源

```bash
cd server

# 创建 D1 数据库
npx wrangler d1 create simpleshare-db

# 创建 R2 存储桶
npx wrangler r2 bucket create simpleshare-files
```

将返回的 `database_id` 填入 `wrangler.toml`。

#### 5. 初始化数据库

```bash
cd server

# 执行数据库 Schema
npx wrangler d1 execute simpleshare-db --file=./src/db/schema.sql

# 可选：导入初始数据
npx wrangler d1 execute simpleshare-db --file=./src/db/seed.sql
```

#### 6. 启动开发服务器

```bash
# 终端 1: 启动前端开发服务器
npm run dev

# 终端 2: 启动后端开发服务器
cd server
npm run dev
```

前端运行在 `http://localhost:5173`，后端 API 运行在 `http://localhost:8788`。

## 📋 部署到 Cloudflare Pages

### 前置要求

1. Cloudflare 账号
2. 已安装 Wrangler CLI: `npm install -g wrangler`
3. 已登录 Wrangler: `npx wrangler login`

### 部署步骤

#### 1. 构建前端

```bash
npm run build
```

构建输出在 `dist/` 目录。

#### 2. 配置生产环境

在 Cloudflare Dashboard 中配置：

1. **创建 D1 数据库**（如果还没有）
   - 进入 Cloudflare Dashboard → D1
   - 创建数据库 `simpleshare-db`
   - 复制 `database_id`

2. **创建 R2 存储桶**（如果还没有）
   - 进入 Cloudflare Dashboard → R2
   - 创建存储桶 `simpleshare-files`

3. **配置环境变量**
   - 进入 Cloudflare Pages 项目 → Settings → Environment Variables
   - 添加以下变量：
     - `JWT_SECRET`: 强随机字符串（用于 JWT 签名）
     - `R2_PUBLIC_URL`: R2 公共访问 URL（可选）

#### 3. 更新 wrangler.toml

确保 `server/wrangler.toml` 中的生产环境配置正确：

```toml
[env.production]
name = "simpleshare"

[[env.production.d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "your-production-database-id"

[[env.production.r2_buckets]]
binding = "FILES"
bucket_name = "simpleshare-files"

[env.production.vars]
JWT_SECRET = "your-production-jwt-secret"
```

#### 4. 初始化生产数据库

```bash
cd server

# 在生产数据库上执行 Schema
npx wrangler d1 execute simpleshare-db --env=production --file=./src/db/schema.sql

# 可选：导入初始数据（创建管理员账户）
npx wrangler d1 execute simpleshare-db --env=production --file=./src/db/seed.sql
```

#### 5. 部署到 Cloudflare Pages

**方式一：使用 Wrangler CLI**

```bash
cd server
npm run deploy
```

**方式二：使用 Cloudflare Dashboard**

1. 进入 Cloudflare Dashboard → Pages
2. 创建新项目或连接 Git 仓库
3. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
   - **根目录**: `/`
4. 配置环境变量（见步骤 2）
5. 保存并部署

#### 6. 配置自定义域名（可选）

1. 在 Cloudflare Pages 项目设置中添加自定义域名
2. 按照提示配置 DNS 记录

## 🔧 环境变量

### 必需变量

- `JWT_SECRET`: JWT 签名密钥（生产环境必须使用强随机字符串）

### 可选变量

- `R2_PUBLIC_URL`: R2 存储桶的公共访问 URL（用于直接访问文件）

## 📚 API 文档

### 认证 API

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

### 文件管理 API

- `GET /api/files/list?parentId={id}&tab={tab}` - 获取文件列表
- `POST /api/files/upload` - 上传文件
- `GET /api/files/download?id={fileId}&shareCode={code}` - 下载文件
- `PUT /api/files/{id}` - 更新文件（重命名、收藏）
- `DELETE /api/files/{id}` - 删除文件
- `POST /api/files/folders` - 创建文件夹

### 分享 API

- `POST /api/shares/create` - 创建分享
- `GET /api/shares/list` - 获取用户分享列表
- `DELETE /api/shares/{id}` - 取消分享
- `GET /api/extract/{code}` - 提取文件信息（访客）

### 管理员 API

- `GET /api/admin/users` - 获取用户列表
- `POST /api/admin/users` - 创建用户
- `PUT /api/admin/users/{id}` - 更新用户
- `DELETE /api/admin/users/{id}` - 删除用户
- `GET /api/admin/groups` - 获取用户组列表
- `POST /api/admin/groups` - 创建用户组
- `PUT /api/admin/groups/{id}` - 更新用户组
- `DELETE /api/admin/groups/{id}` - 删除用户组
- `GET /api/admin/stats` - 获取系统统计
- `GET /api/admin/logs` - 获取系统日志
- `GET /api/admin/files` - 获取所有文件

## 🔐 安全注意事项

1. **JWT_SECRET**: 生产环境必须使用强随机字符串（至少 32 字符）
2. **密码存储**: 使用 SHA-256 哈希存储密码
3. **CORS**: API 已配置 CORS，允许前端域名访问
4. **文件大小限制**: Cloudflare R2 单文件最大 5GB
5. **存储配额**: 系统会检查用户存储配额，防止超出限制

## 📝 数据库 Schema

主要数据表：

- `users` - 用户表
- `files` - 文件元数据表
- `shares` - 分享记录表
- `user_groups` - 用户组表
- `logs` - 系统日志表

详细 Schema 见 `server/src/db/schema.sql`。

## 🧪 测试账户

默认测试账户（如果执行了 seed.sql）：

- **管理员**: `admin@simpleshare.com` / `admin123`
- **普通用户**: `user@simpleshare.com` / `user123`

⚠️ **生产环境请删除测试数据并修改默认密码！**

## 🐛 故障排除

### 数据库连接失败

- 检查 `wrangler.toml` 中的 `database_id` 是否正确
- 确认已执行数据库 Schema

### 文件上传失败

- 检查 R2 存储桶是否已创建
- 检查用户存储配额是否足够
- 检查文件大小是否超过限制

### API 请求失败

- 检查环境变量是否正确配置
- 检查 JWT_SECRET 是否设置
- 查看 Cloudflare Workers 日志

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请提交 Issue。
