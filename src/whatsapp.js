import * as B from '@whiskeysockets/baileys';
import pino from 'pino';
import { PASTA_DADOS } from './config.js';

const lib = B.default?.makeWASocket ? B.default : B;
const makeWASocket = lib.makeWASocket ?? lib.default;
const { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = lib;

/**
 * Conecta no WhatsApp do número do robô.
 * Se passar numeroParaParear e ainda não estiver pareado, mostra um código no log
 * para digitar em: WhatsApp > Aparelhos conectados > Conectar com número de telefone.
 */
export async function conectar({ numeroParaParear } = {}) {
  const { state, saveCreds } = await useMultiFileAuthState(`${PASTA_DADOS}/whatsapp`);
  const { version } = await fetchLatestBaileysVersion();

  if (!numeroParaParear && !state.creds.registered) {
    throw new Error('WhatsApp ainda não pareado. Rode: npm run parear');
  }

  return new Promise((resolve, reject) => {
    let tentativas = 0;
    let codigoPedido = false;

    const iniciar = () => {
      const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });

      sock.ev.on('creds.update', saveCreds);

      if (numeroParaParear && !state.creds.registered && !codigoPedido) {
        codigoPedido = true;
        setTimeout(async () => {
          try {
            const codigo = await sock.requestPairingCode(numeroParaParear.replace(/\D/g, ''));
            console.log('\n==============================================');
            console.log(`   CÓDIGO DE PAREAMENTO:  ${codigo}`);
            console.log('==============================================');
            console.log('No WhatsApp do número do robô: Configurações > Aparelhos conectados >');
            console.log('Conectar aparelho > "Conectar com número de telefone" e digite o código.\n');
          } catch (erro) {
            reject(erro);
          }
        }, 3000);
      }

      sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'open') return resolve(sock);
        if (connection !== 'close') return;

        const motivo = lastDisconnect?.error?.output?.statusCode;
        if (motivo === DisconnectReason.loggedOut) {
          return reject(new Error('O WhatsApp foi desconectado. Rode de novo: npm run parear'));
        }
        if (++tentativas > 5) return reject(new Error(`Não consegui conectar no WhatsApp (código ${motivo}).`));
        setTimeout(iniciar, 2000); // depois do pareamento o WhatsApp pede para reconectar; é normal
      });
    };

    iniciar();
  });
}
