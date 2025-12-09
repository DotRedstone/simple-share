# SimpleShare Backend

基于 Cloudflare Pages Functions + D1 + R2 的 Serverless 后端。

## 技术栈

- **Cloudflare Pages Functions**: API 路由
- **Cloudflare D1**: SQLite 数据库（元数据存储）
- **Cloudflare R2**: 对象存储（文件实体）
- **TypeScript**: 类型安全
- **JWT**: 身份认证

## 项目结构

```
server/
├── functions/           # Cloudflare Pages Functions
│   └── api/            # API 路由
│       ├── auth/       # 认证相关
│       ├── files/      # 文件管理
│       └── shares/     # 分享功能
├── src/
│   ├── utils/          # 工具函数
│   │   ├── db.ts       # 数据库操作
│   │   ├── auth.ts     # 认证工具
│   │   └── r2.ts       # R2 存储工具
│   ├── middleware/     # 中间件
│   │   └── auth.ts     # 认证中间件
│   └── types/          # 类型定义
├── db/
│   └── schema.sql      # 数据库 Schema
├── wrangler.toml       # Cloudflare 配置
└── package.json
```

## 部署步骤

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create simpleshare-db
```

将返回的 `database_id` 填入 `wrangler.toml`

### 2. 创建 R2 存储桶

```bash
npx wrangler r2 bucket create simpleshare-files
```

### 3. 初始化数据库

```bash
npx wrangler d1 execute simpleshare-db --file=./src/db/schema.sql
```

### 4. 配置环境变量

在 Cloudflare Dashboard 中设置：
- `JWT_SECRET`: JWT 密钥（生产环境使用强随机字符串）
- `R2_PUBLIC_URL`: R2 公共访问 URL（可选）

### 5. 部署

```bash
npm run deploy
```

## API 端点

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册

### 文件管理
- `GET /api/files/list` - 获取文件列表
- `POST /api/files/upload` - 上传文件
- `GET /api/files/download?id={fileId}` - 下载文件
- `PUT /api/files/{id}` - 更新文件（重命名、收藏）
- `DELETE /api/files/{id}` - 删除文件

### 分享功能
- `POST /api/shares/create` - 创建分享
- `GET /api/shares/list` - 获取分享列表
- `DELETE /api/shares/{id}` - 取消分享
- `GET /api/extract/{code}` - 提取文件信息

### 管理员
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/stats` - 系统统计
- `GET /api/admin/logs` - 系统日志

## 开发

```bash
# 本地开发
npm run dev

# 构建
npm run build

# 部署
npm run deploy
```

## 注意事项

1. **JWT_SECRET**: 生产环境必须使用强随机字符串
2. **存储配额**: 需要在用户上传时检查配额
3. **文件大小限制**: Cloudflare R2 单文件最大 5GB
4. **CORS**: 需要配置 CORS 允许前端域名访问

