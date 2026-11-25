const real = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Formatação do WhatsApp: *negrito*  ~riscado~  _itálico_
export const montarPost = (oferta) =>
  [
    `🔥 *${oferta.titulo}*`,
    '',
    `~De ${real(oferta.precoAntigo)}~`,
    `💰 *Por ${real(oferta.preco)}*  (${oferta.desconto}% OFF)`,
    oferta.freteGratis ? '🚚 Frete grátis' : null,
    '',
    `🛒 ${oferta.link}`,
    '',
    '_Preço e estoque podem mudar a qualquer momento._',
  ]
    .filter((linha) => linha !== null)
    .join('\n');
