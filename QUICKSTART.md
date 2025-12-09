# SimpleShare 快速开始指南

5 分钟快速部署 SimpleShare 到 Cloudflare Pages。

## ⚡ 快速部署

### 1. 安装依赖

```bash
npm install
cd server && npm install && cd ..
```

### 2. 构建项目

```bash
npm run build
```

### 3. 创建 Cloudflare 资源

```bash
cd server

# 创建 D1 数据库
npx wrangler d1 create simpleshare-db

# 创建 R2 存储桶
npx wrangler r2 bucket create simpleshare-files
```

### 4. 配置 wrangler.toml

将步骤 3 返回的 `database_id` 填入 `server/wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "你的-database-id"  # 替换这里
```

### 5. 初始化数据库

```bash
cd server
npx wrangler d1 execute simpleshare-db --file=./src/db/schema.sql
npx wrangler d1 execute simpleshare-db --file=./src/db/seed.sql
```

### 6. 生成 JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

将输出填入 `server/wrangler.toml` 的 `JWT_SECRET`。

### 7. 部署

```bash
cd server
npm run deploy
```

完成！访问 Cloudflare Pages 提供的 URL 即可使用。

## 🔑 默认账户

执行 `seed.sql` 后会创建以下测试账户：

- **管理员**: `admin@simpleshare.com` / `admin123`
- **普通用户**: `user@simpleshare.com` / `user123`

⚠️ **生产环境请立即修改这些密码！**

## 📚 更多信息

- 详细部署指南: [DEPLOY.md](./DEPLOY.md)
- 完整文档: [README.md](./README.md)

