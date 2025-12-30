# 《分布式对象存储与文件分发系统》项目核心说明（组员参考手册）

## 1. 引言
### 1.1 编写背景及目的
**编写背景：**
随着个人数据量的爆发式增长，传统的单体服务器存储方案面临磁盘空间有限、带宽成本高昂、数据库 BLOB 字段臃肿等瓶颈。组长目前虽运营有四台物理服务器，但考虑到物理服务器资源的稳定性、高昂的带宽成本及生产环境的安全隔离，决定不为本项目开放任何物理机资源，包括现有的 Redis 和 MySQL 实例。

**设计目的：**
基于“能白嫖绝不自建”的原则，本项目旨在利用 Cloudflare Serverless 边缘计算架构，构建一套物理资源零占用的云文件管理系统。
- **存算分离**：彻底将文件元数据与文件实体剥离。
- **边缘计算**：利用 Cloudflare D1 分布式数据库，确保全球范围内的低延迟查询。
- **极致成本控制**：充分利用 R2 提供的 10GB 免费对象存储额度，实现高性能、全球加速的文件分发效果。
- **UI/UX 工业化设计**：全站响应式适配移动端，支持日间/夜间模式丝滑切换，具备多维度数据排序（时间、类型、上传者）功能。
- **内容合规审计**：内置管理员下架（Takedown）机制，物理删除文件并保留违规告知占位符，实现人性化的合规管理。

### 1.2 定义说明
- **D1 (Edge Database)**：部署在边缘节点的分布式关系型数据库。
- **R2 (Object Storage)**：兼容 S3 协议的分布式对象存储。
- **预签名 URL**：后端生成的带权限临时下载链接，实现零带宽消耗。
- **无状态重置令牌 (Stateless Token)**：基于 HMAC 算法的 16 位重置码，仅当天有效。
- **版本指纹失效 (Version Snapshot)**：通过将用户 `updated_at` 时间戳打入哈希算法，实现令牌的“用完即焚”特性。
- **VitePress 文档站点**：独立部署的高性能静态文档系统，支持中英文检索与全端适配。

## 2. 数据库设计
### 2.1 需求分析设计
- **访客**：输入 6 位提取码即可提取内容。
- **注册用户**：文件管理（上传、重命名、删除、收藏、嵌套）、批量操作（移动、删除）、多维排序（按名称/大小/时间/类型）、分享管理、配额查看。
- **管理员**：动态配置存储后端、用户管理与排序、用户组配额管理、文件违规下架处理、全域日志审计。

### 2.2 概念结构设计（E-R图）
系统核心实体及关系如下：
- **UserGroups ↔ Users** (1:N)：用户组定义默认配额，用户归属于特定组。
- **Users ↔ Files** (1:N)：用户拥有并管理其上传的文件或创建的文件夹。
- **Files ↔ Files** (1:N)：通过 `parent_id` 自关联实现无限级文件夹嵌套。
- **Files ↔ Shares** (1:N)：一个文件/文件夹可生成多个带有随机提取码的分享。
- **StorageBackends ↔ Files** (1:N)：文件与其物理存储后端关联（R2/S3/WebDAV等）。
- **Users ↔ UserStorageBackends** (1:N)：用户可挂载私有的加密存储后端。
- **UserGroups ↔ StorageBackends** (N:N)：通过分配表实现存储资源的灵活调度。
- **Users ↔ SystemLogs** (1:N)：记录用户的所有操作审计日志。

### 2.3 逻辑结构设计（关系模式）
本设计严格遵循 **第三范式 (3NF)**，消除数据冗余。核心关系模式如下：
- `user_groups` (id, name, description, storage_quota, max_users, current_users)
- `users` (id, name, email, password_hash, role, status, storage_quota, storage_used, group_id, updated_at)
- `files` (id, name, size_bytes, storage_key, storage_backend_id, user_id, parent_id, path, type, starred, status, created_at, updated_at)
- `shares` (id, file_id, user_id, share_code, expires_at, access_count, max_access)
- `storage_backends` (id, name, type, enabled, is_default, config_json)
- `user_storage_backends` (id, user_id, name, type, enabled, config_encrypted)
- `group_storage_allocations` (id, group_id, storage_backend_id, quota_gb, used_gb)
- `system_logs` (id, action, user_id, user_name, status, details, ip, file_id, file_name, created_at)

## 3. 数据库实现
### 3.1 数据库建立
采用 Cloudflare D1 分布式数据库。完全不占用组长宝贵的四台物理机资源。

### 3.2 建表语句
```sql
-- 用户表
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    storage_used REAL DEFAULT 0.0,
    group_id TEXT,
    updated_at INTEGER
);

-- 文件表 (存算分离核心)
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_key TEXT NOT NULL,
    storage_backend_id TEXT,
    user_id TEXT NOT NULL,
    parent_id INTEGER,
    path TEXT NOT NULL,
    type TEXT NOT NULL,
    starred INTEGER DEFAULT 0,
    status TEXT DEFAULT '活跃',
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES files(id)
);

-- 系统日志表 (审计日志)
CREATE TABLE system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT,
    status TEXT NOT NULL,
    details TEXT,
    ip TEXT,
    file_id INTEGER,
    file_name TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
-- ...
```

### 3.3 逻辑示例
- **多维动态排序**：后端利用 SQL `ORDER BY ${sortBy} ${order}` 实现对千万级元数据的极速检索排序。
- **违规文件下架逻辑**：
  1. 调用 R2 API 删除物理文件。
  2. `UPDATE files SET name = '[违规已下架] ' || name, size_bytes = 0, status = '违规' WHERE id = ?`。
  3. 系统自动在用户端显示“管理员已下架”提示，保留元数据作为通知。
- **自毁式无状态账户找回**：
  - 算法：`HMAC_SHA256(JWT_SECRET, Email + YYYY-MM-DD + updated_at)`
  - 特点：利用数据库已有的 `updated_at` 字段作为版本指纹。重置完成后 `updated_at` 自动更新，旧令牌立即因哈希碰撞失效，实现零存储负载的“一次性令牌”。

## 4. 工业化设计与合规性
### 4.1 全平台适配与主题系统
前端基于 Tailwind CSS 实现了深度的响应式适配与日夜模式切换。
- **响应式布局**：通过 `flex-row md:flex-col` 等响应式断点，实现了移动端底部导航与 PC 端侧边栏的无缝切换。
- **主题变量**：利用 CSS Variables (`--bg-main`, `--text-main`) 配合 `.light` / `.dark` 类名，实现了包括滚动条在内的全站主题平滑切换。

### 4.2 独立文档系统
构建了基于 **VitePress** 的独立文档站点（[ss-doc.dotres.cn](https://ss-doc.dotres.cn/)），实现了项目说明、API 手册与部署指南的专业化呈现，支持全站全文检索。

### 4.3 法律合规与审计
- **备案标识**：项目文档站点已底部悬挂 ICP 备案号（湘ICP备2025111357号），满足国内互联网合规要求。
- **审计链路**：通过 `system_logs` 实现全量操作可追溯，确保每一笔文件流向与配置变更均有据可查。

## 5. 团队分工
- **明航宇 (队长)**：全栈开发、系统架构、UI/UX 工业化设计、VitePress 独立文档系统构建、运维部署。负责录制**系统部署演示视频**。
- **组员 1**：数据库建模、绘制 E-R/DFD 图（包含排序字段与下架状态逻辑）。
- **组员 2**：功能核验、演示数据填充、界面截图（含日夜模式对比截图）。负责录制**系统使用操作视频**。
- **组员 3**：需求分析撰写、报告排版与文档整合。
- **组员 4**：成果汇报、PPT 制作与答辩。

## 6. 心得体会
- **极致白嫖**：通过 Serverless 架构实现了真正的物理资源零占用部署。
- **存算分离**：深刻理解了元数据管理与对象存储解耦的高扩展性优势。
- **工业化标准**：不仅完成了功能，更在 UI 适配、文档系统、合规备案等方面达到了准商用标准。

