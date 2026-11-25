import { spawn } from 'node:child_process';
import { config } from './config.js';

// Fica ligado no celular e roda o "postar" de tempos em tempos, só dentro do horário configurado.
const { hora_inicio = 8, hora_fim = 23, minutos_entre_rodadas = 60 } = config;

const horaDeBrasilia = () =>
  Number(new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }));

const rodarUmaVez = () =>
  new Promise((resolve) => {
    const filho = spawn(process.execPath, ['--env-file=.env', 'src/index.js', 'postar'], { stdio: 'inherit' });
    filho.on('exit', resolve);
  });

console.log(`🤖 Robô ligado. Posta das ${hora_inicio}h às ${hora_fim}h, a cada ${minutos_entre_rodadas} min.`);
console.log('Deixe o Termux aberto em segundo plano. Para parar: Ctrl + C\n');

while (true) {
  const hora = horaDeBrasilia();
  const agora = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  if (hora >= hora_inicio && hora < hora_fim) {
    console.log(`\n⏰ ${agora} — procurando ofertas...`);
    await rodarUmaVez();
  } else {
    console.log(`😴 ${agora} — fora do horário, aguardando.`);
  }
  await new Promise((r) => setTimeout(r, minutos_entre_rodadas * 60 * 1000));
}
