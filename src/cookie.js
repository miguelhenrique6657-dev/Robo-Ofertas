import { fecharPerguntas, perguntar, salvarEnv } from './env.js';

console.log('\n🍪 Cookie de login do Mercado Livre');
console.log('Cole o texto inteiro do cookie e aperte Enter:\n');

const bruto = await perguntar('> ');
fecharPerguntas();

const cookie = bruto
  .replace(/^cookie:\s*/i, '')
  .replace(/["\r\n]/g, '')
  .trim();

if (cookie.length < 50 || !cookie.includes('=')) {
  console.error('\n❌ Isso não parece um cookie completo. Copie de novo e rode: npm run cookie');
  process.exit(1);
}

salvarEnv({ ML_COOKIE: cookie });
console.log(`\n✅ Cookie salvo (${cookie.length} caracteres). Agora rode: npm run testar\n`);
