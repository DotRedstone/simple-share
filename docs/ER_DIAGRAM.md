# SimpleShare 数据库实体关系图 (ER Diagram)

本项目采用基于 Mermaid 语法的 ER 图设计，精准描述了分布式对象存储系统中各实体间的逻辑关联。

```mermaid
erDiagram
    User {
        text id PK "用户唯一标识"
        text name "用户名 (Unique)"
        text email "邮箱 (Unique)"
        text password_hash "密码哈希"
        text role "角色: admin/user"
        text status "状态: 活跃/已暂停"
        real storage_used "已使用存储空间 (GB)"
        text group_id FK "所属用户组 ID"
        int created_at "创建时间戳"
        int updated_at "最后更新时间 (用于令牌指纹)"
    }
    Group {
        text id PK "组唯一标识"
        text name "组名"
        text description "描述"
        real storage_quota "默认存储配额 (GB)"
        int max_users "最大用户数限制"
        int current_users "当前用户统计"
    }
    File {
        int id PK "自增 ID"
        text name "文件名/文件夹名"
        int size_bytes "文件大小 (字节)"
        text mime_type "MIME 类型"
        text storage_key "物理存储键"
        text storage_backend_id FK "存储后端 ID"
        text user_id FK "所属用户 ID"
        int parent_id FK "父目录 ID (自关联)"
        text path "逻辑路径"
        text type "分类: folder/pdf/image/video/zip/code"
        text status "状态: 活跃/违规下架"
        int starred "星标收藏 (0/1)"
        int download_count "累计下载量"
        int created_at "创建时间"
    }
    Share {
        text id PK "分享唯一 ID"
        int file_id FK "关联文件 ID"
        text user_id FK "分享者 ID"
        text share_code "提取码 (Unique)"
        int expiration_days "有效天数"
        int expires_at "过期时间戳"
        int access_count "访问次数统计"
    }
    Backend {
        text id PK "后端唯一标识"
        text name "后端名称"
        text type "类型: r2/s3/webdav/ftp/sftp"
        int enabled "是否启用 (0/1)"
        int is_default "是否为系统默认 (0/1)"
        text config "JSON 配置信息"
    }
    Allocation {
        text id PK "分配记录 ID"
        text group_id FK "关联组 ID"
        text storage_backend_id FK "关联存储后端 ID"
        real quota_gb "分配的配额 (GB)"
    }
    Log {
        int id PK "自增日志 ID"
        text action "动作名称"
        text user_id FK "操作者 ID"
        text user_name "操作者姓名"
        text status "状态: 成功/警告/失败"
        text details "操作详情"
        text ip "客户端 IP"
        int file_id "相关文件 ID"
        text file_name "相关文件名"
        int created_at "记录时间"
    }

    Group ||--o{ User : "包含"
    User ||--o{ File : "拥有"
    File ||--o{ File : "嵌套(parent_id)"
    File ||--o{ Share : "生成提取码"
    Backend ||--o{ File : "存储实体"
    Group ||--o{ Allocation : "配额挂载"
    Backend ||--o{ Allocation : "资源输出"
    User ||--o{ Log : "操作审计"
```

## 设计要点说明：
1. **存算分离**：`File` 实体通过 `storage_backend_id` 灵活关联不同的物理后端（R2/S3等）。
2. **多维审计**：`Log` 记录详尽的操作上下文，支持对管理员与普通用户的行为追踪。
3. **合规设计**：`File` 实体的 `status` 字段配合管理员 Takedown 逻辑，实现对违规内容的元数据保留式删除。
4. **安全指纹**：`User` 实体的 `updated_at` 作为 HMAC 令牌的版本指纹，保障账号找回的安全性。

