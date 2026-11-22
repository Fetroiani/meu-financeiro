# Meu Caixa: app financeiro pessoal (Android e iPhone)

Um app sem fins lucrativos para acompanhar saldo, extrato e gastos por categoria: mercado, bares, vestuário, assinaturas, presentes, investimentos, dólar, euro e extra. Para registrar uma compra, basta fotografar o cupom ou a nota fiscal. O app lê os itens e separa cada um na categoria certa.

## Como funciona

- **Tudo no celular:** a leitura do cupom (OCR com Tesseract, em português) roda no aparelho e funciona sem internet. Os dados ficam só no celular. Para não perder nada, use **Extrato > Backup dos dados**.
- **Separação por categoria:** o app usa palavras-chave e o tipo de loja. Num bar ou restaurante, tudo vai para Bares. No supermercado, cerveja conta como Mercado.
- **Aprende com você:** quando você troca a categoria de um item na revisão, o app guarda a escolha e usa da próxima vez.
- **QR code da NFC-e:** o app lê o QR code e mostra a chave de acesso da nota.

## Estrutura

| Caminho | O que é |
|---|---|
| `www/index.html` | O app (telas, gráficos, lançamentos) |
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
