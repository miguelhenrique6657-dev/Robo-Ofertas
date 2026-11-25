# 🤖 Robô de Ofertas — Mercado Livre → WhatsApp

Lê a página **Ofertas do dia** do Mercado Livre, escolhe os maiores descontos, monta o post (foto, preço riscado, preço novo, % OFF, link de afiliado) e envia no seu grupo de WhatsApp. Roda sozinho no GitHub, de hora em hora, das 8h às 23h.

Tudo abaixo dá pra fazer pelo navegador do celular.

---

## 1. Chip do robô
Use um **número separado** (chip barato) com WhatsApp instalado. Postagem automática por robô não é oficial do WhatsApp e o número pode ser banido — melhor não arriscar o seu pessoal.
Coloque esse número no seu grupo como **admin**.

## 2. Seus parâmetros de afiliado
1. No portal de afiliados, gere o link de **qualquer** produto (vem como `meli.la/...`).
2. Abra esse link no navegador e espere carregar a página do produto.
3. Copie o endereço completo da página e procure os pedaços que começam com `matt_` — algo como:
   `matt_word=SEUNOME&matt_tool=12345678`
4. É isso que vai no segredo `AFILIADO_PARAMS` (só esses pedaços, juntos com `&`).

> ⚠️ Confira no painel de afiliados, depois do primeiro dia, se os cliques estão contando.

## 3. Segredos no GitHub
No repositório: **Settings → Secrets and variables → Actions → New repository secret**

| Nome | O que colocar |
|---|---|
| `WHATS_NUMERO` | número do robô com DDI e DDD, só números: `5531999998888` |
| `AFILIADO_PARAMS` | o do passo 2 |
| `GRUPO_ID` | deixe para o passo 5 |

## 4. Conectar o WhatsApp (uma vez só)
1. Aba **Actions → Robô de Ofertas → Run workflow** → modo **parear** → *Run*.
2. Abra a execução → *rodar* → *Rodar robô*. Vai aparecer **CÓDIGO DE PAREAMENTO: XXXX-XXXX**.
3. No celular do robô: WhatsApp → Configurações → **Aparelhos conectados** → Conectar aparelho → **Conectar com número de telefone** → digite o código.
4. Espere aparecer ✅ *WhatsApp conectado*.

## 5. Descobrir o código do grupo
1. **Run workflow** → modo **listar-grupos**.
2. No log aparece `• Nome do grupo → 1203630xxxxxxx@g.us`.
3. Crie o segredo `GRUPO_ID` com esse `...@g.us`.

## 6. Testar e ligar
- Modo **testar**: mostra no log como os posts ficariam, **sem enviar nada**.
- Modo **postar**: envia de verdade. Depois disso ele roda sozinho de hora em hora.

---

## Ajustes (arquivo `config.json`)
- `paginas_de_ofertas` — quantas páginas de ofertas ler (padrão 3)
- `desconto_minimo` — só posta acima desse % (padrão 30)
- `preco_minimo` / `preco_maximo` — faixa de preço
- `frete_gratis_obrigatorio` — `true` para só postar com frete grátis
- `palavras_obrigatorias` — se preencher (ex.: `["fone", "air fryer"]`), só posta produtos com essas palavras
- `palavras_bloqueadas` — nunca posta produtos com essas palavras
- `max_posts_por_rodada` — quantos posts por hora (padrão 3)
- `repostar_depois_de_dias` — depois de quantos dias o mesmo produto pode voltar

Horários: edite a linha `cron` em `.github/workflows/robo.yml`.

## Se der erro
- **"WhatsApp foi desconectado"** → rode **parear** de novo.
- **"nenhum produto reconhecido"** → o Mercado Livre mudou a página ou bloqueou o acesso. Mande o log para ajustar.
