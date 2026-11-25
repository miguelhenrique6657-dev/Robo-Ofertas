import { config, env } from './config.js';

// O robô lê a página pública "Ofertas do dia" do Mercado Livre (não precisa de aplicação/API).
const PAGINA_OFERTAS = 'https://www.mercadolivre.com.br/ofertas';

const CABECALHOS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  Accept: 'text/html,application/xhtml+xml',
};

// ---------- Link de afiliado ----------
// Coloca os parâmetros da sua conta de afiliado (AFILIADO_PARAMS) no link do produto.

export function linkAfiliado(permalink) {
  const url = new URL(permalink);
  for (const [chave, valor] of new URLSearchParams(env('AFILIADO_PARAMS'))) url.searchParams.set(chave, valor);
  return url.toString();
}

// ---------- Leitura da página ----------

const decodificar = (texto = '') =>
  texto
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

// "199 reais com 90 centavos" -> 199.9
function valorDoAriaLabel(trecho, prefixo) {
  const m = trecho.match(new RegExp(`aria-label="${prefixo}:?\\s*([\\d.]+) reais(?: com (\\d+) centavos)?`, 'i'));
  if (!m) return null;
  return Number(m[1].replace(/\./g, '')) + (m[2] ? Number(m[2]) / 100 : 0);
}

// Plano B: lê os números de dentro do bloco de preço
function valorDoBloco(bloco) {
  if (!bloco) return null;
  const inteiro = bloco.match(/andes-money-amount__fraction[^>]*>([\d.]+)</);
  if (!inteiro) return null;
  const centavos = bloco.match(/andes-money-amount__cents[^>]*>(\d+)</);
  return Number(inteiro[1].replace(/\./g, '')) + (centavos ? Number(centavos[1]) / 100 : 0);
}

function limparLink(href) {
  try {
    const url = new URL(decodificar(href));
    if (!/(^|\.)mercadolivre\.com\.br$/.test(url.hostname) || url.hostname.startsWith('click')) return null;
    url.hash = '';
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

function imagemBoa(trecho) {
  const tag = trecho.match(/<img[^>]+>/)?.[0] ?? '';
  const src = tag.match(/data-src="([^"]+)"/)?.[1] ?? tag.match(/\ssrc="([^"]+)"/)?.[1] ?? '';
  if (!src || src.startsWith('data:')) return null;
  return decodificar(src).replace(/-[A-Z]\.(webp|jpg|png)$/, '-O.jpg');
}

function lerCartao(trecho) {
  const linkTitulo =
    trecho.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*poly-component__title[^"]*"[^>]*>([\s\S]*?)<\/a>/) ??
    trecho.match(/<a[^>]+class="[^"]*poly-component__title[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
  if (!linkTitulo) return null;

  const link = limparLink(linkTitulo[1]);
  const titulo = decodificar(linkTitulo[2]);
  if (!link || !titulo) return null;

  const precoAntigo =
    valorDoAriaLabel(trecho, 'Antes') ??
    valorDoBloco(trecho.match(/andes-money-amount--previous[\s\S]*?<\/s>/)?.[0]);
  const preco =
    valorDoAriaLabel(trecho, 'Agora') ??
    valorDoBloco(trecho.match(/poly-price__current[\s\S]*?andes-money-amount__fraction[\s\S]*?<\/span>[\s\S]*?<\/span>/)?.[0]);

  const id = link.match(/MLB-?\d+/i)?.[0].replace('-', '').toUpperCase() ?? link;

  return {
    id,
    titulo,
    precoAntigo,
    preco,
    freteGratis: /frete gr[aá]tis/i.test(trecho),
    imagem: imagemBoa(trecho),
    link,
  };
}

async function lerPagina(numero) {
  const url = numero > 1 ? `${PAGINA_OFERTAS}?page=${numero}` : PAGINA_OFERTAS;
  const cookie = process.env.ML_COOKIE?.trim();
  const resposta = await fetch(url, { headers: cookie ? { ...CABECALHOS, Cookie: cookie } : CABECALHOS, redirect: 'follow' });
  const html = await resposta.text();
  if (!resposta.ok) throw new Error(`Página ${numero} respondeu ${resposta.status}`);
  if (/account-verification|\/jms\/.*\/login/.test(resposta.url)) {
    throw new Error(
      cookie
        ? 'O Mercado Livre pediu login de novo: o cookie expirou ou não foi aceito. Rode: npm run cookie'
        : 'O Mercado Livre pediu login. Cadastre seu cookie de login com: npm run cookie',
    );
  }

  const cartoes = html.split(/<div[^>]+class="[^"]*\bpoly-card\b/).slice(1).map(lerCartao).filter(Boolean);
  if (!cartoes.length) {
    console.warn(
      `⚠️ Página ${numero}: nenhum produto reconhecido (${html.length} caracteres, endereço final: ${resposta.url}).` +
        ' Se isso continuar, mande este log para ajustar o robô.',
    );
  }
  return cartoes;
}

// ---------- Avaliação das ofertas ----------

function aprovar(oferta) {
  const { precoAntigo, preco } = oferta;
  if (!preco || !precoAntigo || precoAntigo <= preco) return null;

  const desconto = Math.round((1 - preco / precoAntigo) * 100);
  const titulo = oferta.titulo.toLowerCase();

  if (desconto < config.desconto_minimo) return null;
  if (preco < (config.preco_minimo ?? 0) || preco > (config.preco_maximo ?? Infinity)) return null;
  if (config.frete_gratis_obrigatorio && !oferta.freteGratis) return null;
  if ((config.palavras_bloqueadas ?? []).some((p) => titulo.includes(p.toLowerCase()))) return null;
  if (config.palavras_obrigatorias?.length && !config.palavras_obrigatorias.some((p) => titulo.includes(p.toLowerCase()))) {
    return null;
  }
  return { ...oferta, desconto };
}

export async function buscarOfertas() {
  const achados = new Map();

  for (let pagina = 1; pagina <= (config.paginas_de_ofertas ?? 3); pagina++) {
    try {
      const cartoes = await lerPagina(pagina);
      let aprovados = 0;
      for (const cartao of cartoes) {
        const oferta = aprovar(cartao);
        if (oferta) {
          achados.set(oferta.id, oferta);
          aprovados++;
        }
      }
      console.log(`🔎 Página ${pagina}: ${cartoes.length} produtos lidos, ${aprovados} aprovados`);
    } catch (erro) {
      console.warn(`⚠️ ${erro.message}`);
    }
    await new Promise((r) => setTimeout(r, 2000)); // calma entre uma página e outra
  }

  return [...achados.values()].sort((a, b) => b.desconto - a.desconto);
}
