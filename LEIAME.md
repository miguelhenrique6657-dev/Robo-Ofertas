# 🤖 Robô de Ofertas — Mercado Livre → WhatsApp (roda num celular Android)

Lê a página **Ofertas do dia** do Mercado Livre, escolhe os maiores descontos, monta o post (foto, preço riscado, preço novo, % OFF, link de afiliado) e envia no seu grupo de WhatsApp. Roda sozinho no celular Android, de hora em hora, das 8h às 23h.

## Antes de começar
- Celular Android ligado no carregador e no Wi-Fi.
- Um número de WhatsApp para o robô (de preferência um chip separado) que esteja **no grupo como admin**.

## Instalação (uma vez só)
1. Instale o **Termux** pelo **F-Droid** (f-droid.org). A versão da Play Store é antiga e não funciona.
2. Abra o Termux e cole, um bloco por vez:

```
pkg update -y && pkg install -y nodejs git
```
```
git clone https://github.com/miguelhenrique6657-dev/robo-ofertas
cd robo-ofertas
npm install
```

3. Configure:
```
npm run configurar
```
4. Teste se ele consegue ler as ofertas (não envia nada):
```
npm run testar
```
5. Conecte o WhatsApp do robô (aparece um código; digite em WhatsApp → Aparelhos conectados → Conectar com número de telefone):
```
npm run parear
```
6. Escolha o grupo:
```
npm run grupos
```
7. Ligue o robô:
```
npm start
```

## Para ele não ser fechado pelo Android
- Configurações → Apps → Termux → Bateria → **Sem restrições**.
- Deixe a notificação do Termux ativa (o `npm start` já segura o celular acordado).

## Se o celular reiniciar
Abra o Termux e rode:
```
cd robo-ofertas && npm start
```

## Atualizar o robô
```
cd robo-ofertas && git pull && npm install
```

## Ajustes (arquivo `config.json`)
- `hora_inicio` / `hora_fim` / `minutos_entre_rodadas` — horários
- `desconto_minimo` — só posta acima desse % (padrão 30)
- `preco_minimo` / `preco_maximo` — faixa de preço
- `frete_gratis_obrigatorio` — `true` para só postar com frete grátis
- `palavras_obrigatorias` / `palavras_bloqueadas` — filtrar por palavras no título
- `max_posts_por_rodada` — quantos posts por rodada (padrão 3)
