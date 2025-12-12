# 环境变量配置指南

## ⚠️ 重要提示

**环境变量必须在 Cloudflare Dashboard 中配置，不要修改 `wrangler.toml` 文件中的环境变量值！**

在 Dashboard 中配置的环境变量会持久化保存，每次自动部署时不会丢失。

## 配置步骤

### 1. 进入 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录你的账号
3. 选择你的账户

### 2. 找到你的 Worker

1. 在左侧菜单点击 **Workers & Pages**
2. 找到并点击你的 Worker 名称（`simple-share`）

### 3. 配置环境变量

1. 点击顶部的 **Settings** 标签页
2. 向下滚动找到 **Variables** 部分
3. 点击 **Environment Variables** 子部分
4. ⚠️ **重要**：确保选择 **Production** 环境（不是 Preview）
5. 点击 **Add variable** 添加以下变量：

#### 必需变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `JWT_SECRET` | JWT 签名密钥（至少 32 字符） | `your-super-secret-jwt-key-at-least-32-chars` |
| `R2_PUBLIC_URL` | R2 公共访问 URL（可选） | `https://your-r2-domain.com` |

### 4. 保存配置

1. 添加完所有变量后，点击 **Save** 按钮
2. ✅ **验证**：在变量列表中应该能看到所有添加的变量

## 验证配置

### 方法 1：在 Dashboard 中查看

1. 进入 Worker 的 **Settings** 页面
2. 查看 **Environment Variables** 部分
3. 确认所有变量都已正确添加

### 方法 2：通过应用测试

部署后，访问你的 Worker URL，如果环境变量配置正确，应用应该能正常运行。

## 常见问题

### Q: 为什么环境变量在自动部署后丢失？

**A:** 可能的原因：
1. 在 **Preview** 环境中配置了变量，而不是 **Production** 环境
2. 变量名拼写错误
3. 没有点击 **Save** 按钮保存

**解决方案：**
- 确保在 **Production** 环境中配置变量
- 检查变量名是否正确（区分大小写）
- 配置后一定要点击 **Save**

### Q: 可以在 `wrangler.toml` 中配置环境变量吗？

**A:** 可以，但不推荐用于生产环境：
- `wrangler.toml` 中的变量会被提交到 Git，敏感信息可能泄露
- Dashboard 中的配置更安全，且会持久化保存

**推荐做法：**
- 本地开发：在 `wrangler.toml` 中使用占位符
- 生产环境：在 Dashboard 中配置真实值

### Q: 如何更新环境变量？

**A:** 
1. 在 Dashboard 中找到对应的变量
2. 点击变量右侧的编辑按钮
3. 修改值后点击 **Save**

### Q: 环境变量区分大小写吗？

**A:** 是的，环境变量名区分大小写。确保使用正确的大小写：
- ✅ `JWT_SECRET`
- ❌ `jwt_secret` 或 `Jwt_Secret`

## 安全建议

1. **不要**在 `wrangler.toml` 中存储敏感信息
2. **不要**将包含真实环境变量的配置文件提交到 Git
3. **定期**轮换密钥（特别是 `JWT_SECRET`）
4. **使用**强随机字符串作为 `JWT_SECRET`（至少 32 字符）

## 相关文档

- [Cloudflare Workers 环境变量文档](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Wrangler 配置文档](https://developers.cloudflare.com/workers/wrangler/configuration/)
