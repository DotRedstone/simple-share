const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');

if (!fs.existsSync(wranglerPath)) {
  process.exit(0);
}

let content = fs.readFileSync(wranglerPath, 'utf8');

// 只针对 JWT_SECRET 进行自动化处理
if (!content.includes('JWT_SECRET = "') || content.includes('dev-jwt-secret') || content.includes('your-jwt-secret')) {
  const secret = crypto.randomBytes(32).toString('hex');
  console.log('🚀 正在生成生产环境随机 JWT_SECRET...');

  // 确保 [vars] 存在并注入
  if (content.includes('[vars]')) {
    if (content.includes('JWT_SECRET =')) {
      content = content.replace(/JWT_SECRET\s*=\s*".*?"/g, `JWT_SECRET = "${secret}"`);
    } else {
      content = content.replace(/\[vars\]/g, `[vars]\nJWT_SECRET = "${secret}"`);
    }
  } else {
    content += `\n\n[vars]\nJWT_SECRET = "${secret}"`;
  }

  // 同步到生产环境配置
  if (content.includes('[env.production.vars]')) {
    if (content.includes('JWT_SECRET =', content.indexOf('[env.production.vars]'))) {
      const parts = content.split('[env.production.vars]');
      parts[1] = parts[1].replace(/JWT_SECRET\s*=\s*".*?"/, `JWT_SECRET = "${secret}"`);
      content = parts.join('[env.production.vars]');
    } else {
      content = content.replace(/\[env.production.vars\]/g, `[env.production.vars]\nJWT_SECRET = "${secret}"`);
    }
  } else {
    content += `\n\n[env.production.vars]\nJWT_SECRET = "${secret}"`;
  }

  fs.writeFileSync(wranglerPath, content);
  console.log('✅ 随机密钥已自动注入 wrangler.toml');
}

