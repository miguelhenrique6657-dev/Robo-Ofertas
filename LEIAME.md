# 🤖 Robô de Ofertas — Mercado Livre → WhatsApp

Acha produtos com desconto no Mercado Livre, monta o post (foto, preço riscado, preço novo, % OFF, link de afiliado) e envia no seu grupo de WhatsApp. Roda sozinho no GitHub, de hora em hora, das 8h às 23h.

Tudo abaixo dá pra fazer pelo navegador do celular.

---

## 1. Repositório PRIVADO no GitHub
Crie o repositório como **Private**. O robô guarda a sessão do WhatsApp; em repositório público isso fica exposto.
(Conta grátis tem 2.000 min/mês em privado; o robô gasta ~1.000.)

## 2. Chip do robô
Use um **número separado** (chip barato) com WhatsApp instalado. Postagem automática por robô não é oficial do WhatsApp e o número pode ser banido — melhor não arriscar o seu pessoal.
Coloque esse número no seu grupo como **admin**.

## 3. App no Mercado Livre (para buscar ofertas)
1. Entre em **developers.mercadolivre.com.br** → *Minhas aplicações* → *Criar aplicação*.
2. Em **URI de redirect**, coloque: `https://www.google.com`
3. Anote o **Client ID** e o **Client Secret**.

## 4. Seus parâmetros de afiliado
1. No portal de afiliados, gere o link de **qualquer** produto (vem como `meli.la/...`).
2. Abra esse link no navegador e espere carregar a página do produto.
3. Copie o endereço completo da página e procure os pedaços que começam com `matt_` — algo como:
   `matt_word=SEUNOME&matt_tool=12345678`
4. É isso que vai no segredo `AFILIADO_PARAMS` (só esses pedaços, juntos com `&`).

> ⚠️ Confira no painel de afiliados, depois do primeiro dia, se os cliques estão contando. Se não estiverem, me mande o endereço completo do passo 3 que eu ajusto.

## 5. Segredos no GitHub
No repositório: **Settings → Secrets and variables → Actions → New repository secret**

| Nome | O que colocar |
|---|---|
| `ML_CLIENT_ID` | Client ID do passo 3 |
| `ML_CLIENT_SECRET` | Client Secret do passo 3 |
| `ML_REDIRECT_URI` | `https://www.google.com` |
| `WHATS_NUMERO` | número do robô com DDI e DDD, só números: `5531999998888` |
| `AFILIADO_PARAMS` | o do passo 4 |
| `GRUPO_ID` | deixe para o passo 8 |

## 6. Autorizar o Mercado Livre (uma vez só)
1. Abra no navegador (troque `SEU_CLIENT_ID`):
   `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=SEU_CLIENT_ID&redirect_uri=https://www.google.com`
2. Faça login e autorize. Vai cair no Google com um endereço tipo `google.com/?code=TG-xxxxxxxx`.
3. Copie o `TG-xxxxxxxx`.
4. No GitHub: aba **Actions → Robô de Ofertas → Run workflow** → modo **ml-autorizar** → cole o código → *Run*.
   (O código vale só alguns minutos — faça rápido.)

## 7. Conectar o WhatsApp (uma vez só)
1. **Actions → Run workflow** → modo **parear**.
2. Abra a execução → *rodar* → *Rodar robô*. Vai aparecer **CÓDIGO DE PAREAMENTO: XXXX-XXXX**.
3. No celular do robô: WhatsApp → Configurações → **Aparelhos conectados** → Conectar aparelho → **Conectar com número de telefone** → digite o código.
4. Espere aparecer ✅ *WhatsApp conectado*.

## 8. Descobrir o código do grupo
1. **Run workflow** → modo **listar-grupos**.
2. No log aparece `• Nome do grupo → 1203630xxxxxxx@g.us`.
3. Crie o segredo `GRUPO_ID` com esse `...@g.us`.

## 9. Testar e ligar
- Modo **testar**: mostra no log como os posts ficariam, **sem enviar nada**.
- Modo **postar**: envia de verdade. Depois disso ele roda sozinho de hora em hora.

---

## Ajustes (arquivo `config.json`)
- `buscas` — o que procurar: `{ "palavra": "air fryer" }` ou `{ "categoria": "MLB1051" }`
- `desconto_minimo` — só posta acima desse % (padrão 30)
- `preco_minimo` / `preco_maximo` — faixa de preço
- `frete_gratis_obrigatorio` — `true` para só postar com frete grátis
- `max_posts_por_rodada` — quantos posts por hora (padrão 3)
- `repostar_depois_de_dias` — depois de quantos dias o mesmo produto pode voltar

Horários: edite a linha `cron` em `.github/workflows/robo.yml`.

## Se der erro
- **"WhatsApp foi desconectado"** → rode **parear** de novo.
- **"Mercado Livre ainda não autorizado"** ou erro de token → refaça o passo 6.
- **Erro 403 nas buscas** → me mande o log; o Mercado Livre às vezes muda as regras da API.
