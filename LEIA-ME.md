# Anotei Já: app financeiro pessoal (Android e iPhone)

Um app sem fins lucrativos para acompanhar saldo, extrato e gastos por categoria: mercado, conta de consumo (condomínio, água, luz, gás, IPTU), bares, vestuário, assinaturas, presentes, investimentos, dólar, euro e extra. Para registrar uma compra, basta fotografar o cupom ou a nota fiscal. O app lê os itens e separa cada um na categoria certa.

## Link com atalho na tela (recomendado)

**Link do app:** https://fetroiani.github.io/meu-financeiro/

O app funciona direto no navegador do celular, como um link. Para publicar de graça pelo GitHub Pages:
1. Envie esta pasta para um repositório no GitHub.
2. Em **Settings > Pages**, escolha **Source: GitHub Actions**. O fluxo "Publicar o link" gera o endereço `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
3. No celular, abra o link:
   - **iPhone (Safari):** toque em Compartilhar e depois em **Adicionar à Tela de Início**.
   - **Android (Chrome):** toque em ⋮ e depois em **Instalar app** (ou **Adicionar à tela inicial**).
   O atalho usa o logo do Anotei Já e abre em tela cheia, como um app.

**Segurança:** ao abrir pela primeira vez, você cria um PIN de 6 dígitos. Os dados são criptografados com AES-256, usando uma chave protegida pelo PIN (PBKDF2, 310 mil iterações), e ficam só no seu celular. Nada vai para servidores. Depois de 5 erros de PIN, o app faz você esperar. Ele também se bloqueia sozinho 1 minuto depois que você sai dele. No app nativo dá para entrar com Face ID ou digital.

## Cadastro antes de abrir o app

A página inicial pede nome completo, celular e e-mail e grava na tabela `cadastros` do Supabase (migração `supabase/migrations/20261123000001_cadastros.sql`). O site só consegue **gravar**: ninguém lê, muda ou apaga cadastros pelo site. Para ver a lista, abra o painel do Supabase em **Table Editor > cadastros**.

Para funcionar, preencha `supabaseUrl` e `supabaseKey` (a chave pública *anon*/*publishable*) em `www/config.js` e aplique a migração. Sem isso, o formulário avisa que o cadastro está em manutenção e não libera o app.

Depois do cadastro, a pessoa escolhe **Android (abre no Chrome)** ou **iPhone (abre no Safari)**. No Chrome o app mostra o botão **Instalar**; no Safari, o botão **Adicionar à Tela de Início** com o passo a passo e uma seta até o botão Compartilhar. No computador, aparece um QR Code para abrir no celular já liberado.

## Dê sua opinião

O botão **Dê sua opinião** (canto de baixo da página inicial e rodapé) abre um formulário com nota de 1 a 5, comentário, e nome e e-mail opcionais. As respostas vão para a tabela `opinioes` do Supabase (migração `supabase/migrations/20261124000001_opinioes.sql`). O site só grava; para ler, abra **Table Editor > opinioes** no painel do Supabase.

O app tem o mesmo formulário no fim da tela **Início** e no menu ☰ (**Dê sua opinião**). Ele grava na mesma tabela; a coluna `pagina` diz de onde veio (`site` ou `app`).

### Avaliações no Google

Depois de enviar a opinião, o site e o app mostram o botão **Avaliar no Google**, que abre a página de avaliação do Perfil da Empresa no Google. O botão só aparece quando o link estiver preenchido em `www/config.js`, no campo `googleReviewUrl`:

1. Crie o perfil em <https://www.google.com/business/> (pode ser um negócio sem endereço físico, só com área de atendimento ou site).
2. No perfil, toque em **Pedir avaliações** e copie o link (algo como `https://g.page/r/XXXX/review`).
3. Cole o link em `googleReviewUrl` e publique.

O botão aparece para todas as notas, não só para as altas: o Google proíbe pedir avaliação só para quem gostou. As opiniões do formulário não vão para o Google automaticamente; cada pessoa precisa publicar a dela lá.

## Como funciona

- **Tudo no celular:** a leitura do cupom (OCR com Tesseract, em português) roda no aparelho e funciona sem internet. Os dados ficam só no celular. Para não perder nada, use **Extrato > Backup dos dados**.
- **Separação por categoria:** o app usa palavras-chave e o tipo de loja. Num bar ou restaurante, tudo vai para Bares. No supermercado, cerveja conta como Mercado.
- **Aprende com você:** quando você troca a categoria de um item na revisão, o app guarda a escolha e usa da próxima vez.
- **QR code da NFC-e:** o app lê o QR code e mostra a chave de acesso da nota.

## Estrutura

| Caminho | O que é |
|---|---|
| `www/index.html` | Página inicial do link: apresenta o app e pede o cadastro (nome, celular, e-mail) antes de liberar o app. Estilos em `www/site/site.css` (`npm run site-css`) |
| `www/app.html` | O app (telas, gráficos, lançamentos). Quem abre no navegador sem cadastro volta para a página inicial; o ícone instalado abre direto |
| `www/cupom.js` | Lê o texto do cupom e define a categoria de cada item. Para adicionar palavras-chave, mexa aqui |
| `scripts/copy-assets.js` | Copia o motor de OCR e o idioma português para `www/vendor` |
| `scripts/test-parser.js` | Testes do leitor de cupom (`npm test`) |
| `android/`, `ios/` | Projetos nativos gerados pelo Capacitor |
| `.github/workflows/android.yml` | Gera o APK de teste automaticamente no GitHub |

## Android: instalar para testar

**Opção A, sem instalar nada no computador (GitHub):**
1. Envie esta pasta para um repositório no GitHub.
2. Em **Actions > APK Android de teste**, abra a última execução e baixe o arquivo `meu-caixa-apk`.
3. No celular, abra o `app-debug.apk` e permita a instalação de "fontes desconhecidas" quando o Android pedir.

**Opção B, com o Android Studio:**
1. Instale o [Node.js](https://nodejs.org) e o [Android Studio](https://developer.android.com/studio).
2. Nesta pasta, rode `npm install` e depois `npm run android`. O Android Studio vai abrir.
3. Ligue o celular no cabo, com a depuração USB ativada, e clique em ▶ Run.

## iPhone: instalar para testar

Para instalar no iPhone, a Apple exige um **Mac com Xcode**.

1. No Mac, instale o Node.js e o Xcode (pela App Store).
2. Nesta pasta, rode `npm install` e depois `npm run ios`. O Xcode vai abrir.
3. Em **Signing & Capabilities**, escolha o seu Apple ID em Team. Se precisar, troque o Bundle Identifier por algo único, como `br.seunome.meucaixa`.
4. Ligue o iPhone no cabo, escolha o aparelho no topo da janela e clique em ▶.
5. No iPhone, vá em **Ajustes > Geral > VPN e Gerenciamento de Dispositivos** e confie no seu perfil de desenvolvedor.

Com um Apple ID gratuito, o app instalado funciona por 7 dias. Depois disso, é só instalar de novo pelo Xcode. Para distribuir pelo TestFlight, sem cabo e sem esse prazo, é preciso o Apple Developer Program (US$ 99 por ano).

## Desenvolvimento

```bash
npm install
npm test          # testes do leitor de cupom
npm run sync      # copia www/ para os projetos nativos
cd www && python3 -m http.server 8080   # testar no navegador: http://localhost:8080
```
