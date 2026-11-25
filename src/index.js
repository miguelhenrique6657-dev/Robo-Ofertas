import { config, env, esperar, lerJson, salvarJson } from './config.js';
import { buscarOfertas, linkAfiliado } from './mercadolivre.js';
import { montarPost } from './post.js';

const modo = process.argv[2] || 'postar';

async function modoParear() {
  const { conectar } = await import('./whatsapp.js');
  const sock = await conectar({ numeroParaParear: env('WHATS_NUMERO') });
  console.log('✅ WhatsApp conectado! Agora rode: npm run grupos');
  await esperar(15000); // tempo para salvar a sessão
  sock.end(undefined);
}

async function modoListarGrupos() {
  const { conectar } = await import('./whatsapp.js');
  const sock = await conectar();
  const grupos = await sock.groupFetchAllParticipating();
  const lista = Object.values(grupos);
  await esperar(3000);
  sock.end(undefined);
  if (!lista.length) throw new Error('O número do robô não está em nenhum grupo. Adicione ele no grupo e rode de novo.');

  console.log('\nGrupos do robô:\n');
  lista.forEach((grupo, i) => console.log(`  ${i + 1}) ${grupo.subject}`));
  const { fecharPerguntas, perguntar, salvarEnv } = await import('./env.js');
  const escolha = Number(await perguntar('\nDigite o número do grupo onde o robô vai postar: '));
  fecharPerguntas();
  const grupo = lista[escolha - 1];
  if (!grupo) throw new Error('Número inválido. Rode de novo: npm run grupos');
  salvarEnv({ GRUPO_ID: grupo.id });
  console.log(`✅ Grupo escolhido: ${grupo.subject}`);
}

async function modoTestar() {
  const ofertas = await buscarOfertas();
  console.log(`\n${ofertas.length} oferta(s) encontradas. As 3 primeiras ficariam assim:\n`);
  for (const oferta of ofertas.slice(0, 3)) {
    console.log(`[foto] ${oferta.imagem}`);
    console.log(montarPost({ ...oferta, link: linkAfiliado(oferta.link) }));
    console.log('\n----------------------------\n');
  }
}

async function modoPostar() {
  const postados = lerJson('postados.json', {});
  const agora = Date.now();
  const prazo = config.repostar_depois_de_dias * 24 * 60 * 60 * 1000;
  for (const [id, quando] of Object.entries(postados)) if (agora - quando > prazo) delete postados[id];

  const ofertas = (await buscarOfertas())
    .filter((oferta) => !postados[oferta.id])
    .slice(0, config.max_posts_por_rodada);

  if (!ofertas.length) {
    console.log('Nenhuma oferta nova desta vez.');
    return;
  }

  const { conectar } = await import('./whatsapp.js');
  const sock = await conectar();
  const grupo = env('GRUPO_ID');

  for (const [i, oferta] of ofertas.entries()) {
    const texto = montarPost({ ...oferta, link: linkAfiliado(oferta.link) });
    try {
      if (!oferta.imagem) throw new Error('sem foto');
      await sock.sendMessage(grupo, { image: { url: oferta.imagem }, caption: texto });
    } catch {
      await sock.sendMessage(grupo, { text: texto }); // se a foto falhar, manda só o texto
    }
    postados[oferta.id] = agora;
    salvarJson('postados.json', postados);
    console.log(`📤 Postado: ${oferta.titulo} (${oferta.desconto}% OFF)`);
    if (i < ofertas.length - 1) await esperar(config.segundos_entre_posts * 1000);
  }

  await esperar(5000);
  sock.end(undefined);
}

const modos = {
  parear: modoParear,
  'listar-grupos': modoListarGrupos,
  testar: modoTestar,
  postar: modoPostar,
};

if (!modos[modo]) {
  console.error(`Modo desconhecido: ${modo}. Use: ${Object.keys(modos).join(', ')}`);
  process.exit(1);
}

modos[modo]()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error('❌', erro.message);
    process.exit(1);
  });
