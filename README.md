# SimpleShare

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.2-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)

一个安全、极速的文件传输与分享平台，基于 Vue 3 + TypeScript + Cloudflare Workers 构建。

## 🚀 快速部署

### 1. Fork 仓库

点击 GitHub 右上角的 **Fork** 按钮，将此仓库 Fork 到你的账号。

### 2. 登录 Cloudflare 控制台

访问 [Cloudflare 控制台](https://dash.cloudflare.com/)，登录你的账号。

### 3. 创建 Worker

1. 在 Cloudflare 控制台左侧菜单，点击 **Workers & Pages** → **Create** → **Worker**
2. 选择 **Connect to Git**
3. 授权 Cloudflare 访问你的 GitHub
4. 选择你 Fork 的 `simple-share` 仓库
5. 配置构建设置：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Node.js version**: `20` 或更高版本

### 4. 创建并绑定资源

#### 创建 D1 数据库

1. 在 Cloudflare 控制台左侧菜单，点击 **Workers & Pages** → **D1**
2. 点击 **Create database**
3. 数据库名称：`simpleshare-db`
4. 创建后，复制 `database_id`（格式类似：`fe372b0a-2da1-40aa-b3d8-1e5fcc72a43d`）

#### 创建 R2 存储桶（推荐）

1. 在 Cloudflare 控制台左侧菜单，点击 **R2**
2. 点击 **Create bucket**
3. 存储桶名称：`simpleshare-files`

#### 绑定资源到 Worker

1. 在 Cloudflare 控制台左侧菜单，点击 **Workers & Pages** → 选择你的 Worker（`simple-share`）
2. 点击顶部的 **Settings** 标签页
3. 向下滚动找到 **Variables** 部分
4. 在 **D1 Database bindings** 中点击 **Add binding**：
   - Variable name: `DB`
   - Database: 选择 `simpleshare-db`
   - 点击 **Save**
5. 在 **R2 Bucket bindings** 中点击 **Add binding**（用于文件实际存储，推荐配置）：
   - Variable name: `FILES`
   - Bucket: 选择 `simpleshare-files`
   - 点击 **Save**

### 5. 配置环境变量

1. 在同一个 **Settings** 页面，向下滚动到 **Environment Variables** 部分
2. 点击 **Add variable** 添加：
   - `JWT_SECRET`: 你的 JWT 密钥（至少 32 字符的随机字符串）
     - 生成方式：`openssl rand -hex 32`
3. ⚠️ **重要**：确保选择 **Production** 环境（不是 Preview）

### 6. 初始化管理员账户

项目不会自动创建管理员账号，你需要在部署后手动初始化一次 D1 数据库中的管理员：

1. 本地安装并登录 Cloudflare Wrangler：
   - 安装：`npm install -g wrangler`
   - 登录：`wrangler login`
2. 在本项目根目录执行（远程生产数据库）：
   - `cd server`
   - `npx wrangler d1 execute simpleshare-db --remote --file=./src/db/seed.sql`
3. 执行完成后，会在 `users` 表中创建一个默认管理员：
   - 登录邮箱：`admin@simpleshare.com`
   - 登录密码：`admin123`
4. 使用该账号登录后，建议尽快在数据库中修改密码或在生产环境前先编辑 `server/src/db/seed.sql`，替换为你自己的邮箱和密码哈希。

### 7. 部署

1. 点击 **Save and Deploy**
2. 等待构建完成
3. ✅ **完成！** Worker 会在首次请求时自动初始化数据库

## ✨ 功能特性

- 🔒 **安全认证** - JWT 身份验证，密码加密存储
- 📁 **文件管理** - 上传、下载、删除、重命名、收藏文件
- 📂 **文件夹系统** - 创建文件夹，组织文件结构
- 🔗 **文件分享** - 生成提取码，设置有效期，分享文件
- 📊 **个人仪表盘** - 查看文件列表、最近文件、收藏文件
- 👥 **管理员功能** - 用户管理、存储管理、系统日志

## 🛠️ 技术栈

- **Vue 3** + **TypeScript** - 前端框架
- **Cloudflare Workers** - Serverless 后端
- **Cloudflare D1** - SQLite 数据库
- **Cloudflare R2** - 对象存储
- **JWT** - 身份认证

## 📄 许可证

MIT License
