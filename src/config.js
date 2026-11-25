import fs from 'node:fs';

// Pasta onde o robô guarda: sessão do WhatsApp, token do Mercado Livre e ofertas já postadas.
// No GitHub ela é salva entre uma rodada e outra pelo cache do Actions.
export const PASTA_DADOS = 'dados';
fs.mkdirSync(PASTA_DADOS, { recursive: true });

export const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

export const env = (nome) => {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`Falta o segredo ${nome} no GitHub (Settings > Secrets and variables > Actions).`);
  return valor;
};

export const lerJson = (arquivo, padrao) => {
  try {
    return JSON.parse(fs.readFileSync(`${PASTA_DADOS}/${arquivo}`, 'utf8'));
  } catch {
    return padrao;
  }
};

export const salvarJson = (arquivo, dados) =>
  fs.writeFileSync(`${PASTA_DADOS}/${arquivo}`, JSON.stringify(dados, null, 2));

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
