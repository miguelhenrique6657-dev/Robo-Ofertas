import fs from 'node:fs';
import readline from 'node:readline/promises';

const ARQUIVO = '.env';

let linhas;
export async function perguntar(texto) {
  process.stdout.write(texto);
  linhas ??= readline.createInterface({ input: process.stdin, terminal: false })[Symbol.asyncIterator]();
  const { value } = await linhas.next();
  return (value ?? '').trim();
}
export const fecharPerguntas = () => process.stdin.pause();

export function lerEnv() {
  if (!fs.existsSync(ARQUIVO)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(ARQUIVO, 'utf8')
      .split('\n')
      .filter((linha) => linha.includes('='))
      .map((linha) => {
        const i = linha.indexOf('=');
        return [linha.slice(0, i).trim(), linha.slice(i + 1).trim().replace(/^"|"$/g, '')];
      }),
  );
}

export function salvarEnv(novos) {
  const tudo = { ...lerEnv(), ...novos };
  fs.writeFileSync(
    ARQUIVO,
    Object.entries(tudo)
      .map(([chave, valor]) => `${chave}="${valor}"`)
      .join('\n') + '\n',
  );
}
