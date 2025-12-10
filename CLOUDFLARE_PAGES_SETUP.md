# Cloudflare Pages 部署配置说明

## ⚠️ 重要：删除部署命令

如果你看到以下错误：
```
Executing user deploy command: npx wrangler deploy
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

**这是因为在 Cloudflare Pages 中配置了错误的部署命令。**

### 🚨 紧急修复（如果无法立即访问 Dashboard）

如果你暂时无法访问 Cloudflare Dashboard，可以临时使用以下方法：

在 Cloudflare Pages 的 **Deploy command** 字段中，将 `npx wrangler deploy` 替换为：
```bash
node scripts/noop-deploy.js
```

这会避免部署错误，但**正确的做法仍然是删除部署命令**。

## 🔧 修复步骤

### 方法一：通过 Cloudflare Dashboard（推荐）

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 进入 **Workers & Pages** → **Pages**
   - 选择你的项目

2. **进入构建设置**
   - 点击 **Settings**（设置）
   - 在左侧菜单中找到 **Builds & deployments**（构建和部署）

3. **删除部署命令**
   - 找到 **Deploy command**（部署命令）字段
   - **删除其中的所有内容**（包括 `npx wrangler deploy` 等）
   - **留空**，不要填写任何内容
   - 点击 **Save**（保存）

4. **重新部署**
   - 点击 **Deployments**（部署）
   - 点击最新的部署记录右侧的 **Retry deployment**（重试部署）
   - 或者点击 **Create deployment**（创建部署）触发新的部署

### 方法二：通过 Wrangler CLI（如果已安装）

如果你使用 Wrangler CLI 管理项目，确保没有在配置文件中设置部署命令。

## ✅ 正确的构建设置

你的 Cloudflare Pages 项目应该使用以下设置：

| 设置项 | 值 |
|--------|-----|
| **Framework preset** | `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` |
| **Deploy command** | （留空，不要设置） |

## 📝 为什么不需要部署命令？

Cloudflare Pages 会自动：
1. 运行构建命令（`npm run build`）
2. 从构建输出目录（`dist`）读取文件
3. 自动识别 `dist/functions` 目录中的 Cloudflare Pages Functions
4. 部署静态文件和 Functions

**不需要额外的部署命令！**

## 🔍 如何验证配置正确？

1. 进入 **Settings** → **Builds & deployments**
2. 检查 **Deploy command** 字段：
   - ✅ 正确：字段为空或显示 "No deploy command"
   - ❌ 错误：字段中有 `npx wrangler deploy` 或其他命令

3. 如果字段不为空，请删除其中的内容并保存。

## 🆘 仍然遇到问题？

如果删除部署命令后仍然有问题，请检查：

1. **构建命令是否正确**
   - 应该是 `npm run build`
   - 构建脚本会自动将 `server/functions` 复制到 `dist/functions`

2. **构建输出目录是否正确**
   - 应该是 `dist`
   - 确保 `dist` 目录包含 `index.html` 和 `functions` 目录

3. **查看构建日志**
   - 在部署页面查看构建日志
   - 确认看到 "✓ Functions copied to dist/functions" 消息

4. **检查 Functions 目录**
   - 构建后，`dist/functions` 应该包含：
     - `_middleware.ts`
     - `api/` 目录及其所有子文件

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages Functions 文档](https://developers.cloudflare.com/pages/platform/functions/)

