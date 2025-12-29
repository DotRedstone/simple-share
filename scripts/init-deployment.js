const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function initWrangler() {
  if (!fs.existsSync(wranglerPath)) {
    console.error('❌ 错误: 未找到 wrangler.toml');
    process.exit(1);
  }

  let content = fs.readFileSync(wranglerPath, 'utf8');
  
  // 检查是否已经有了有效的 JWT_SECRET
  const hasSecret = content.includes('JWT_SECRET = "') && 
                   !content.includes('dev-jwt-secret') && 
                   !content.includes('your-jwt-secret');

  if (!hasSecret) {
    const newSecret = generateSecret();
    console.log('\n🚀 正在为生产环境生成随机 JWT_SECRET...');
    
    // 如果 [vars] 下已经有了 JWT_SECRET，替换它
    if (content.includes('JWT_SECRET =')) {
      content = content.replace(/JWT_SECRET\s*=\s*".*?"/g, `JWT_SECRET = "${newSecret}"`);
    } else {
      // 否则在 [vars] 部分插入
      content = content.replace(/\[vars\]/g, `[vars]\nJWT_SECRET = "${newSecret}"`);
    }
    
    // 同步更新生产环境配置部分 [env.production.vars]
    if (content.includes('[env.production.vars]')) {
      if (content.includes('JWT_SECRET =', content.indexOf('[env.production.vars]'))) {
        // 复杂正则替换特定部分的变量
        const parts = content.split('[env.production.vars]');
        parts[1] = parts[1].replace(/JWT_SECRET\s*=\s*".*?"/, `JWT_SECRET = "${newSecret}"`);
        content = parts.join('[env.production.vars]');
      } else {
        content = content.replace(/\[env.production.vars\]/g, `[env.production.vars]\nJWT_SECRET = "${newSecret}"`);
      }
    }

    fs.writeFileSync(wranglerPath, content);
    console.log('✅ 已将随机密钥写入 wrangler.toml。');
    console.log('💡 密钥已生成并加密，你可以随时在 Cloudflare Dashboard 中手动修改。\n');
  } else {
    console.log('✅ 检测到已存在自定义 JWT_SECRET，跳过生成。');
  }
}

initWrangler();

