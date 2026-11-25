import { config, env, esperar, lerJson, salvarJson } from './config.js';
import { buscarOfertas, linkAfiliado } from './mercadolivre.js';
import { montarPost } from './post.js';

const modo = process.argv[2] || 'postar';

async function modoParear() {
  const { conectar } = await import('./whatsapp.js');
  const sock = await conectar({ numeroParaParear: env('WHATS_NUMERO') });
  console.log('✅ WhatsApp conectado! Agora rode o modo "listar-grupos".');
  await esperar(15000); // tempo para salvar a sessão
  sock.end(undefined);
}

async function modoListarGrupos() {
  const { conectar } = await import('./whatsapp.js');
  const sock = await conectar();
  const grupos = await sock.groupFetchAllParticipating();
  console.log('\nGrupos do robô (copie o código do seu grupo para o segredo GRUPO_ID):\n');
  for (const grupo of Object.values(grupos)) console.log(`• ${grupo.subject}  →  ${grupo.id}`);
  await esperar(3000);
  sock.end(undefined);
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
