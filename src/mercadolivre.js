import { config, env, lerJson, salvarJson } from './config.js';

const API = 'https://api.mercadolibre.com';

// ---------- Token (o Mercado Livre troca o refresh_token a cada uso, então ele fica salvo em dados/) ----------

async function pedirToken(params) {
  const corpo = new URLSearchParams({
    client_id: env('ML_CLIENT_ID'),
    client_secret: env('ML_CLIENT_SECRET'),
    ...params,
  });
  const resposta = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: corpo,
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(`Mercado Livre recusou o token: ${JSON.stringify(dados)}`);

  salvarJson('ml-token.json', {
    access_token: dados.access_token,
    refresh_token: dados.refresh_token,
    expira_em: Date.now() + (dados.expires_in - 300) * 1000,
  });
  return dados.access_token;
}

export const autorizar = (codigo) =>
  pedirToken({ grant_type: 'authorization_code', code: codigo, redirect_uri: env('ML_REDIRECT_URI') });

async function token() {
  const salvo = lerJson('ml-token.json', null);
  if (!salvo) throw new Error('Mercado Livre ainda não autorizado. Rode o modo "ml-autorizar" (veja o LEIAME).');
  if (Date.now() < salvo.expira_em) return salvo.access_token;
  return pedirToken({ grant_type: 'refresh_token', refresh_token: salvo.refresh_token });
}

async function get(caminho) {
  const resposta = await fetch(API + caminho, { headers: { Authorization: `Bearer ${await token()}` } });
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} em ${caminho}: ${await resposta.text()}`);
  return resposta.json();
}

// ---------- Link de afiliado ----------
// Coloca os parâmetros da sua conta de afiliado (AFILIADO_PARAMS) no link do produto.

export function linkAfiliado(permalink) {
  const url = new URL(permalink);
  for (const [chave, valor] of new URLSearchParams(env('AFILIADO_PARAMS'))) url.searchParams.set(chave, valor);
  return url.toString();
}

// ---------- Busca e avaliação das ofertas ----------

const imagemGrande = (url = '') =>
  url.replace(/^http:/, 'https:').replace(/-[A-Z]\.(jpg|webp)$/, '-O.$1');

function avaliar(item) {
  const precoAntigo = item.original_price;
  const preco = item.price;
  if (!precoAntigo || precoAntigo <= preco) return null;
  if (item.condition && item.condition !== 'new') return null;

  const desconto = Math.round((1 - preco / precoAntigo) * 100);
  const freteGratis = Boolean(item.shipping?.free_shipping);

  if (desconto < config.desconto_minimo) return null;
  if (preco < (config.preco_minimo ?? 0) || preco > (config.preco_maximo ?? Infinity)) return null;
  if (config.frete_gratis_obrigatorio && !freteGratis) return null;

  return {
    id: item.id,
    titulo: item.title,
    precoAntigo,
    preco,
    desconto,
    freteGratis,
    imagem: imagemGrande(item.thumbnail),
    link: item.permalink,
  };
}

export async function buscarOfertas() {
  const achados = new Map();

  for (const busca of config.buscas) {
    const params = new URLSearchParams({ limit: '50', condition: 'new' });
    if (busca.categoria) params.set('category', busca.categoria);
    if (busca.palavra) params.set('q', busca.palavra);
    const nome = busca.nome || busca.palavra || busca.categoria;

    try {
      const dados = await get(`/sites/MLB/search?${params}`);
      let quantos = 0;
      for (const item of dados.results ?? []) {
        const oferta = avaliar(item);
        if (oferta) {
          achados.set(oferta.id, oferta);
          quantos++;
        }
      }
      console.log(`🔎 ${nome}: ${quantos} oferta(s) aprovada(s)`);
    } catch (erro) {
      console.warn(`⚠️ Busca "${nome}" falhou: ${erro.message}`);
    }
  }

  // Maiores descontos primeiro
  return [...achados.values()].sort((a, b) => b.desconto - a.desconto);
}
