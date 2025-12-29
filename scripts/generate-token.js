const crypto = require('crypto');

// 从环境或命令行获取
const email = process.argv[2];
// 尝试从 wrangler.toml 或环境读取，这里默认读取本地配置逻辑
const secret = process.env.JWT_SECRET || 'your-fallback-secret-if-not-set';

if (!email) {
  console.log('\n❌ 使用方式: node scripts/generate-token.js <用户邮箱>');
  console.log('示例: node scripts/generate-token.js test@example.com\n');
  process.exit(1);
}

function generateToken(email, secret) {
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const data = `${email.toLowerCase()}:${dateStr}`;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
    
  return hash;
}

const token = generateToken(email, secret);

console.log('\n=======================================');
console.log(`📧 用户邮箱: ${email.toLowerCase()}`);
console.log(`📅 有效日期: ${new Date().toISOString().split('T')[0]}`);
console.log(`🔑 重置令牌: ${token}`);
console.log('=======================================\n');
console.log('💡 请将此令牌发送给用户，仅限今日有效。\n');

