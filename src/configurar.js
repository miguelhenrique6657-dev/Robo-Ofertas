import { fecharPerguntas, lerEnv, perguntar, salvarEnv } from './env.js';

const atual = lerEnv();

console.log('\n🤖 Configuração do Robô de Ofertas\n');

const numero = (
  await perguntar(
    `Número do WhatsApp do robô, com 55 + DDD, só números (ex.: 5531999998888)${atual.WHATS_NUMERO ? ` [${atual.WHATS_NUMERO}]` : ''}: `,
  )
).replace(/\D/g, '') || atual.WHATS_NUMERO;

const afiliado =
  (await perguntar(
    `Código de afiliado (ex.: matt_word=...&matt_tool=...)${atual.AFILIADO_PARAMS ? ` [${atual.AFILIADO_PARAMS}]` : ''}: `,
  )) || atual.AFILIADO_PARAMS;

fecharPerguntas();

if (!numero || !afiliado) {
  console.error('❌ Preencha os dois campos. Rode de novo: npm run configurar');
  process.exit(1);
}

salvarEnv({ WHATS_NUMERO: numero, AFILIADO_PARAMS: afiliado });
console.log('\n✅ Configuração salva! Próximo passo: npm run parear\n');
