# SimpleShare 本地开发指南

## 前置要求

- Node.js 18+ 
- npm 或 yarn
- Cloudflare Wrangler CLI（已包含在依赖中）

## 快速开始

### 方式一：使用启动脚本（推荐）

```bash
./start-dev.sh
```

### 初始化测试数据（首次运行）

```bash
cd server
npx wrangler d1 execute simpleshare-db --file=./src/db/seed.sql
```

这将创建默认管理员账户：
- **用户名**: `admin`
- **密码**: `admin123`
- **邮箱**: `admin@simpleshare.com`

⚠️ **注意**: 默认密码仅用于开发测试，生产环境请务必修改！

### 方式二：手动启动

#### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

#### 2. 初始化数据库

```bash
cd server
npx wrangler d1 execute simpleshare-db --file=./src/db/migrations/001_initial.sql
```

#### 3. 确保 functions 目录链接存在

```bash
# 如果 dist/functions 不存在，创建符号链接
mkdir -p dist
ln -sf ../server/functions dist/functions
```

#### 4. 启动后端服务器

```bash
cd server
npm run dev
```

后端将在 `http://localhost:8788` 启动

#### 5. 启动前端开发服务器

在项目根目录运行：

```bash
npm run dev
```

前端将在 `http://localhost:5173` 启动

## 项目结构

```
SimpleShare/
├── src/                    # 前端源码
│   ├── api/               # API 调用封装
│   ├── components/         # Vue 组件
│   ├── stores/            # Pinia 状态管理
│   ├── views/             # 页面视图
│   └── types/             # TypeScript 类型定义
├── server/                # 后端源码
│   ├── functions/         # Cloudflare Pages Functions
│   │   └── api/          # API 路由
│   ├── src/              # 后端工具和类型
│   │   ├── utils/       # 工具函数
│   │   └── db/          # 数据库相关
│   └── wrangler.toml     # Wrangler 配置
└── dist/                  # 构建输出（前端）
```

## API 端点

### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

### 文件管理
- `GET /api/files/list` - 获取文件列表
- `POST /api/files/upload` - 上传文件
- `GET /api/files/download` - 下载文件
- `DELETE /api/files/[id]` - 删除文件

### 分享
- `POST /api/shares/create` - 创建分享
- `GET /api/shares/list` - 获取分享列表
- `GET /api/extract/[code]` - 通过提取码获取文件

### 管理（需要 admin 权限）
- `GET /api/admin/stats` - 系统统计
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/files` - 所有文件
- `GET /api/admin/logs` - 系统日志

## 环境变量

### 前端
在项目根目录创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8788/api
```

### 后端
在 `server/wrangler.toml` 中配置：

```toml
[vars]
JWT_SECRET=your-jwt-secret-key-change-in-production
R2_PUBLIC_URL=https://your-r2-domain.com
```

## 数据库操作

### 查看数据库

```bash
cd server
npx wrangler d1 execute simpleshare-db --command="SELECT * FROM users;"
```

### 执行 SQL 文件

```bash
cd server
npx wrangler d1 execute simpleshare-db --file=./path/to/file.sql
```

### 查看所有表

```bash
cd server
npx wrangler d1 execute simpleshare-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## 常见问题

### 1. 后端启动失败

- 检查 `wrangler.toml` 配置是否正确
- 确认数据库已创建：`npx wrangler d1 list`
- 检查端口 8788 是否被占用

### 2. 前端无法连接后端

- 确认后端已启动在 `http://localhost:8788`
- 检查 `vite.config.ts` 中的代理配置
- 查看浏览器控制台的网络请求

### 3. 数据库错误

- 确认已执行迁移：`npx wrangler d1 execute simpleshare-db --file=./src/db/migrations/001_initial.sql`
- 检查 `wrangler.toml` 中的数据库 ID 是否正确

## 开发提示

1. **热重载**：前端和后端都支持热重载，修改代码后自动刷新
2. **类型检查**：运行 `npm run type-check` 检查 TypeScript 类型错误
3. **代码格式化**：使用 Prettier 格式化代码
4. **API 测试**：可以使用 Postman 或 curl 测试 API

## 下一步

- 配置 R2 存储桶用于文件存储
- 设置生产环境变量
- 配置 CI/CD 流程
- 添加单元测试和集成测试

