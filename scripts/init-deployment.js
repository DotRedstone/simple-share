const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');

function generateSecret() {
  return 'ss_auto_' + crypto.randomBytes(24).toString('hex');
}

function initWrangler() {
  if (!fs.existsSync(wranglerPath)) {
    console.error('❌ 错误: 未找到 wrangler.toml');
    process.exit(1);
  }

  let content = fs.readFileSync(wranglerPath, 'utf8');
  
  // 检查是否已经有了有效的 JWT_SECRET（不含占位符）
  const hasSecret = content.includes('JWT_SECRET = "') && 
                   !content.includes('dev-jwt-secret') && 
                   !content.includes('your-jwt-secret') &&
                   !content.includes('placeholder');

  if (!hasSecret) {
    const newSecret = generateSecret();
    console.log('\n✨ 正在自动生成生产级随机 JWT_SECRET...');
    
    // 1. 替换或插入 [vars] 下的变量
    if (content.includes('JWT_SECRET =')) {
      content = content.replace(/JWT_SECRET\s*=\s*".*?"/g, `JWT_SECRET = "${newSecret}"`);
    } else {
      content = content.replace(/\[vars\]/g, `[vars]\nJWT_SECRET = "${newSecret}"`);
    }
    
    // 2. 替换或插入 [env.production.vars] 下的变量
    if (content.includes('[env.production.vars]')) {
      const parts = content.split('[env.production.vars]');
      if (parts[1].includes('JWT_SECRET =')) {
        parts[1] = parts[1].replace(/JWT_SECRET\s*=\s*".*?"/, `JWT_SECRET = "${newSecret}"`);
      } else {
        parts[1] = `\nJWT_SECRET = "${newSecret}"` + parts[1];
      }
      content = parts.join('[env.production.vars]');
    }

    fs.writeFileSync(wranglerPath, content);
    console.log('✅ 密钥已自动注入 wrangler.toml 并准备同步至 Cloudflare 控制台。\n');
  }
}

initWrangler();
