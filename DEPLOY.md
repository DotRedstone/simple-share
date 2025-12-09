# SimpleShare 部署指南

本文档详细说明如何将 SimpleShare 部署到 Cloudflare Pages。

## 📋 部署清单

在开始部署前，请确保：

- [ ] 已注册 Cloudflare 账号
- [ ] 已安装 Node.js 18+ 和 npm
- [ ] 已安装 Wrangler CLI: `npm install -g wrangler`
- [ ] 已登录 Wrangler: `npx wrangler login`

## 🚀 完整部署流程

### 步骤 1: 准备项目

```bash
# 克隆或下载项目
git clone <repository-url>
cd SimpleShare

# 安装依赖
npm install
cd server && npm install && cd ..
```

### 步骤 2: 构建前端

```bash
npm run build
```

构建完成后，`dist/` 目录包含：
- 前端静态文件
- `functions/` 目录（Cloudflare Pages Functions）

### 步骤 3: 创建 Cloudflare 资源

#### 3.1 创建 D1 数据库

```bash
cd server
npx wrangler d1 create simpleshare-db
```

输出示例：
```
✅ Successfully created DB 'simpleshare-db' in region APAC

[[d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "fe372b0a-2da1-40aa-b3d8-1e5fcc72a43d"  # 复制这个 ID
```

#### 3.2 创建 R2 存储桶

```bash
npx wrangler r2 bucket create simpleshare-files
```

输出示例：
```
✅ Created bucket "simpleshare-files"
```

### 步骤 4: 配置 wrangler.toml

编辑 `server/wrangler.toml`，填入步骤 3 获取的 `database_id`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "fe372b0a-2da1-40aa-b3d8-1e5fcc72a43d"  # 替换为你的 ID

[[r2_buckets]]
binding = "FILES"
bucket_name = "simpleshare-files"

[vars]
JWT_SECRET = "dev-jwt-secret-change-in-production"  # 开发环境
```

### 步骤 5: 初始化数据库

```bash
cd server

# 执行数据库 Schema
npx wrangler d1 execute simpleshare-db --file=./src/db/schema.sql

# 可选：导入初始数据（创建测试账户）
npx wrangler d1 execute simpleshare-db --file=./src/db/seed.sql
```

### 步骤 6: 配置生产环境

#### 6.1 在 Cloudflare Dashboard 中配置

1. **进入 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 选择你的账户

2. **创建生产环境 D1 数据库**（如果还没有）
   - 导航到 **Workers & Pages** → **D1**
   - 点击 **Create database**
   - 名称: `simpleshare-db`
   - 区域: 选择离用户最近的区域
   - 复制 `database_id`

3. **创建生产环境 R2 存储桶**（如果还没有）
   - 导航到 **R2**
   - 点击 **Create bucket**
   - 名称: `simpleshare-files`
   - 区域: 选择离用户最近的区域

4. **创建 Pages 项目**
   - 导航到 **Workers & Pages** → **Pages**
   - 点击 **Create a project**
   - 选择 **Upload assets** 或连接 Git 仓库

#### 6.2 更新生产环境配置

编辑 `server/wrangler.toml`，添加生产环境配置：

```toml
[env.production]
name = "simpleshare"

[[env.production.d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "your-production-database-id"  # 替换为生产环境 ID

[[env.production.r2_buckets]]
binding = "FILES"
bucket_name = "simpleshare-files"

[env.production.vars]
JWT_SECRET = "your-production-jwt-secret"  # 使用强随机字符串
```

#### 6.3 初始化生产数据库

```bash
cd server

# 在生产数据库上执行 Schema
npx wrangler d1 execute simpleshare-db --env=production --file=./src/db/schema.sql

# 可选：导入初始数据
npx wrangler d1 execute simpleshare-db --env=production --file=./src/db/seed.sql
```

### 步骤 7: 生成 JWT Secret

生产环境必须使用强随机字符串作为 JWT_SECRET：

```bash
# 使用 OpenSSL 生成随机字符串
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

将生成的字符串填入 `wrangler.toml` 的 `[env.production.vars]` 部分。

### 步骤 8: 部署到 Cloudflare Pages

#### 方式一：使用 Wrangler CLI（推荐）

```bash
cd server
npm run deploy
```

#### 方式二：使用 Cloudflare Dashboard

1. **进入 Pages 项目设置**
   - 导航到你的 Pages 项目
   - 点击 **Settings** → **Builds & deployments**

2. **配置构建设置**
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

3. **配置环境变量**
   - 点击 **Settings** → **Environment variables**
   - 添加以下变量：
     - `JWT_SECRET`: 你的生产环境 JWT Secret
     - `R2_PUBLIC_URL`: R2 公共访问 URL（可选）

4. **配置 D1 数据库绑定**
   - 点击 **Settings** → **Functions** → **D1 database bindings**
   - 添加绑定：
     - **Variable name**: `DB`
     - **D1 database**: `simpleshare-db`

5. **配置 R2 存储桶绑定**
   - 点击 **Settings** → **Functions** → **R2 bucket bindings**
   - 添加绑定：
     - **Variable name**: `FILES`
     - **R2 bucket**: `simpleshare-files`

6. **部署**
   - 点击 **Deployments** → **Retry deployment** 或触发新的部署

### 步骤 9: 验证部署

1. **访问部署的 URL**
   - Cloudflare Pages 会提供一个 `*.pages.dev` 域名
   - 或使用你配置的自定义域名

2. **测试功能**
   - 注册新账户
   - 上传文件
   - 创建分享
   - 使用提取码提取文件

3. **检查日志**
   - 在 Cloudflare Dashboard → Workers & Pages → 你的项目 → Logs
   - 查看是否有错误

## 🔧 后续配置

### 配置自定义域名

1. 在 Cloudflare Pages 项目设置中添加自定义域名
2. 按照提示配置 DNS 记录（CNAME 或 A 记录）
3. Cloudflare 会自动配置 SSL 证书

### 配置 R2 公共访问（可选）

如果需要直接通过 URL 访问文件：

1. 在 R2 存储桶设置中启用公共访问
2. 配置自定义域名
3. 在环境变量中设置 `R2_PUBLIC_URL`

### 监控和日志

- **实时日志**: Cloudflare Dashboard → Workers & Pages → 你的项目 → Logs
- **分析**: Cloudflare Dashboard → Analytics
- **错误追踪**: 查看 Workers 日志中的错误信息

## 🐛 常见问题

### 问题 1: 数据库连接失败

**症状**: API 返回 500 错误，日志显示数据库连接失败

**解决方案**:
1. 检查 `wrangler.toml` 中的 `database_id` 是否正确
2. 确认已执行数据库 Schema
3. 检查 D1 数据库绑定是否正确配置

### 问题 2: 文件上传失败

**症状**: 上传文件时返回错误

**解决方案**:
1. 检查 R2 存储桶是否已创建
2. 检查 R2 存储桶绑定是否正确配置
3. 检查用户存储配额是否足够
4. 检查文件大小是否超过限制（R2 单文件最大 5GB）

### 问题 3: JWT 认证失败

**症状**: 登录后无法访问受保护的路由

**解决方案**:
1. 检查 `JWT_SECRET` 环境变量是否正确设置
2. 确认生产环境和开发环境使用不同的 JWT_SECRET
3. 清除浏览器缓存和 localStorage

### 问题 4: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决方案**:
1. 检查 API 的 CORS 配置（已在 `src/utils/cors.ts` 中配置）
2. 确认前端域名已添加到允许列表

### 问题 5: 构建失败

**症状**: 部署时构建失败

**解决方案**:
1. 检查 Node.js 版本（需要 18+）
2. 检查依赖是否正确安装
3. 查看构建日志中的具体错误信息

## 📊 性能优化建议

1. **启用 Cloudflare CDN**: Pages 自动使用 Cloudflare CDN
2. **启用缓存**: 静态资源会自动缓存
3. **优化图片**: 上传前压缩图片
4. **分页加载**: 大量文件时使用分页
5. **懒加载**: 图片和组件使用懒加载

## 🔐 安全建议

1. **定期更新依赖**: `npm audit` 检查安全漏洞
2. **使用强密码**: JWT_SECRET 使用强随机字符串
3. **启用 2FA**: Cloudflare 账户启用双因素认证
4. **限制 API 访问**: 考虑添加速率限制
5. **定期备份**: 定期备份 D1 数据库

## 📞 获取帮助

- 查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- 查看 [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- 查看 [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- 提交 Issue 到项目仓库

