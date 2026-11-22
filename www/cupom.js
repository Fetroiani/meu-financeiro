/* Anotei Já: transforma o texto lido de um cupom fiscal em itens com categoria.
   Tudo roda no aparelho, sem internet. */
(function (root) {
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

  // Palavras-chave por categoria (comparadas sem acento, em maiúsculas).
  const KW = {
    bares: ['CERVEJA', 'CHOPP', 'CHOPE', 'CAIPIRINHA', 'CAIPIROSKA', 'DRINK', 'DOSE', 'GIN TONIC', 'PORCAO', 'PETISCO', 'COUVERT',
      'TAXA DE SERVICO', 'TX SERVICO', 'SERVICO 10', 'GORJETA', 'ESPETINHO', 'BALDE', 'LONG NECK', 'HEINEKEN', 'BRAHMA', 'SKOL',
      'BUDWEISER', 'STELLA', 'CORONA', 'ORIGINAL 600', 'AMSTEL', 'SPATEN', 'EISENBAHN', 'ITAIPAVA', 'IMPERIO', 'PRATO EXECUTIVO',
      'REFEICAO', 'SELF SERVICE', 'RODIZIO', 'PIZZA', 'HAMBURGUER', 'X BURGER', 'X SALADA', 'X TUDO', 'LANCHE', 'PASTEL', 'COXINHA',
      'ESPRESSO', 'CAPPUCCINO', 'CAFE EXPRESSO', 'SUCO NATURAL', 'BATATA FRITA', 'FRANGO A PASSARINHO', 'CALABRESA ACEB', 'ISCA'],
    vestuario: ['CAMISA', 'CAMISETA', 'BLUSA', 'CALCA', 'BERMUDA', 'SHORT', 'SAIA', 'VESTIDO', 'JAQUETA', 'CASACO', 'MOLETOM',
      'MEIA ', 'MEIAS', 'CUECA', 'CALCINHA', 'SUTIA', 'PIJAMA', 'TENIS', 'SAPATO', 'SANDALIA', 'CHINELO', 'BOTA ', 'BONE', 'CINTO',
      'BOLSA', 'MOCHILA', 'REGATA', 'POLO', 'JEANS', 'LEGGING', 'BIQUINI', 'SUNGA', 'BLAZER', 'CARDIGAN', 'HAVAIANAS'],
    presentes: ['PRESENTE', 'EMBALAGEM PRESENTE', 'PAPEL PRESENTE', 'SACOLA PRESENTE', 'CARTAO ANIVERSARIO', 'CARTAO DE ANIVERSARIO',
      'CARTAO COMEMORATIVO', 'BRINQUEDO', 'BONECA', 'BONECO', 'PELUCIA', 'LEGO', 'BUQUE', 'FLORES', 'ROSAS', 'ORQUIDEA',
      'CESTA DE CAFE', 'CAIXA BOMBOM', 'VALE PRESENTE', 'GIFT CARD', 'LACO '],
    assinaturas: ['ASSINATURA', 'MENSALIDADE', 'NETFLIX', 'SPOTIFY', 'DISNEY', 'HBO', 'MAX ', 'PRIME VIDEO', 'AMAZON PRIME', 'YOUTUBE',
      'DEEZER', 'GLOBOPLAY', 'PARAMOUNT', 'APPLE TV', 'ICLOUD', 'GOOGLE ONE', 'GOOGLE STORAGE', 'MICROSOFT 365', 'OFFICE 365',
      'ACADEMIA', 'SMART FIT', 'SMARTFIT', 'GYMPASS', 'WELLHUB', 'CRUNCHYROLL', 'CHATGPT', 'CLAUDE', 'PLANO MENSAL'],
    combustivel: ['GASOLINA', 'ETANOL', 'ALCOOL HIDRATADO', 'DIESEL', 'GNV', 'COMBUSTIVEL', 'ABASTECIMENTO', 'ADITIVADA', 'POSTO '],
    contas: ['CONDOMINIO', 'TAXA CONDOMINIAL', 'COTA CONDOMINIAL', 'IPTU', 'CONTA DE AGUA', 'CONTA DE LUZ', 'CONTA DE GAS',
      'ENERGIA ELETRICA', 'FORNECIMENTO DE ENERGIA', 'CONSUMO DE ENERGIA', 'AGUA E ESGOTO', 'CONSUMO DE AGUA', 'SANEAMENTO',
      'GAS ENCANADO', 'GAS NATURAL', 'GAS CANALIZADO', 'BOTIJAO', 'GLP 13', 'RECARGA GAS'],
    investimentos: ['TESOURO', 'CDB', 'LCI', 'LCA', 'FUNDO DE INVEST', 'APLICACAO', 'CORRETORA', 'ACOES', 'POUPANCA', 'PREVIDENCIA'],
    dolar: ['DOLAR', 'USD', 'US$'],
    euro: ['EURO', 'EUR ', '€'],
    mercado: ['ARROZ', 'FEIJAO', 'ACUCAR', 'CAFE', 'LEITE', 'OLEO', 'AZEITE', 'MACARRAO', 'FARINHA', 'SAL ', 'OVOS', 'OVO ', 'PAO',
      'MANTEIGA', 'MARGARINA', 'QUEIJO', 'PRESUNTO', 'MORTADELA', 'IOGURTE', 'IOG ', 'REQUEIJAO', 'CARNE', 'FRANGO', 'PEITO',
      'COXA', 'ALCATRA', 'PATINHO', 'ACEM', 'PICANHA', 'LINGUICA', 'SALSICHA', 'BACON', 'PEIXE', 'TILAPIA', 'SARDINHA', 'ATUM',
      'BANANA', 'MACA', 'LARANJA', 'LIMAO', 'TOMATE', 'CEBOLA', 'ALHO', 'BATATA', 'CENOURA', 'ALFACE', 'MAMAO', 'UVA', 'MELANCIA',
      'BISCOITO', 'BOLACHA', 'CHOCOLATE', 'ACHOCOLATADO', 'CEREAL', 'AVEIA', 'GRANOLA', 'MOLHO', 'EXTRATO', 'MAIONESE', 'KETCHUP',
      'TEMPERO', 'REFRIGERANTE', 'REFRIG', 'COCA', 'GUARANA', 'SUCO', 'AGUA MINERAL', 'AGUA MIN', 'DETERGENTE', 'SABAO', 'AMACIANTE',
      'DESINFETANTE', 'AGUA SANITARIA', 'ESPONJA', 'PAPEL HIGIENICO', 'PAPEL HIG', 'PAPEL TOALHA', 'GUARDANAPO', 'SABONETE',
      'SHAMPOO', 'CONDICIONADOR', 'CREME DENTAL', 'PASTA DENTAL', 'ESCOVA DENTAL', 'DESODORANTE', 'ABSORVENTE', 'FRALDA',
      'SACO LIXO', 'SACO DE LIXO', 'HORTIFRUTI', 'LEGUME', 'VERDURA', 'FRUTA', 'PADARIA', 'BOLO', 'TORRADA', 'GELEIA', 'MEL ',
      'CERVEJA LATA', 'VINHO', 'RACAO']
  };
  // Pistas pelo nome da loja: valem para os itens que não tiverem palavra-chave própria.
  const LOJA = {
    combustivel: ['POSTO', 'AUTO POSTO', 'SHELL', 'IPIRANGA', 'PETROBRAS', 'BR DISTRIBUIDORA', 'VIBRA', 'RAIZEN', 'ALE COMBUSTIVEIS', 'COMBUSTIVEIS', 'SIM REDE DE POSTOS'],
    bares: ['BAR ', ' BAR', 'BOTECO', 'CHOPERIA', 'CHOPPERIA', 'RESTAURANTE', 'LANCHONETE', 'PIZZARIA', 'CHURRASCARIA', 'PUB ',
      'CERVEJARIA', 'BISTRO', 'CAFETERIA', 'PADARIA E CONFEITARIA', 'SORVETERIA', 'HAMBURGUERIA', 'SUSHI', 'TEMAKERIA', 'BURGER', 'OUTBACK', 'MC DONALDS', 'MCDONALDS'],
    vestuario: ['RENNER', 'C&A', 'C & A', 'RIACHUELO', 'MARISA', 'HERING', 'ZARA', 'CENTAURO', 'NETSHOES', 'DECATHLON', 'CALCADOS',
      'MODAS', 'CONFECC', 'BOUTIQUE', 'ARTIGOS ESPORTIVOS', 'AREZZO', 'YOUCOM', 'PERNAMBUCANAS'],
    presentes: ['FLORICULTURA', 'BRINQUEDOS', 'RI HAPPY', 'PBKIDS', 'PRESENTES', 'CACAU SHOW', 'KOPENHAGEN'],
    mercado: ['SUPERMERCADO', 'SUPERMERCADOS', 'MERCADO', 'ATACAD', 'ASSAI', 'CARREFOUR', 'PAO DE ACUCAR', 'EXTRA ', 'DIA ', 'BIG ',
      'MAKRO', 'SAMS CLUB', 'HORTIFRUTI', 'SACOLAO', 'MERCEARIA', 'EMPORIO', 'FARMACIA', 'DROGARIA', 'DROGASIL', 'RAIA', 'PAGUE MENOS', 'PANIFICADORA', 'PADARIA']
  };
  const ORDEM = ['combustivel', 'contas', 'dolar', 'euro', 'investimentos', 'assinaturas', 'presentes', 'vestuario', 'bares', 'mercado'];

  // Linhas que têm valor mas não são itens.
  const NAO_ITEM = /(SUB ?TOTAL|\bTOTAL\b|TROCO|DINHEIRO|CART[AÃ]O DE|CREDITO|CR[EÉ]DITO|D[EÉ]BITO|DEBITO|\bPIX\b|VALOR PAGO|VALOR A PAGAR|VL\.? ?PAGO|FORMA DE PAG|PAGAMENTO|TRIBUTO|IMPOSTO|LEI 12|ICMS|\bPIS\b|\bCOFINS\b|CNPJ|CPF|INSCRI|\bIE\b|\bIM\b|QTD\.? ?TOTAL|QTDE\.? ?TOTAL|ITENS|ACRESC|SALDO|PROTOCOLO|CHAVE|EXTRATO N|N[º°O]\.? ?\d{3,}|SERIE|VIA CONSUM|CONSUMIDOR|TEL[:. ]|FONE|ENDERE|\bRUA\b|\bAV\b)/;
  const DESC = /(DESCONTO|DESC\.? ?(ITEM|SUB|TOTAL)?\b)/;

  const money = s => { s = String(s); if (!s.includes(',') && /\.\d{2}$/.test(s)) return parseFloat(s) || 0; const n = parseFloat(s.replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  const VAL_RE = /(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+\.\d{2})\s*[A-Z]?\s*$/; // valor no fim da linha (às vezes seguido de letra de tributação)

  function limparDesc(l) {
    let d = l.replace(VAL_RE, '');
    d = d.replace(/^\s*\d{1,4}[\s.\-)]+/, '');            // número do item
    d = d.replace(/\b\d{8,14}\b/g, '');                    // código de barras
    d = d.replace(/\b\d+([.,]\d+)?\s*(UN|UND|UNID|KG|G|L|ML|PC|PCT|CX|LT|FD)\b\.?\s*[X*]\s*\d+[.,]\d{2,3}.*$/i, ''); // 1 UN X 28,90
    d = d.replace(/\s+[X*]\s*\d+[.,]\d{2}\s*$/i, '');
    d = d.replace(/\s+(UN|UND|KG|PC|L)\s*$/i, '');
    d = d.replace(/[|_~]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return d;
  }

  function lojaCat(loja) {
    const L = ' ' + norm(loja) + ' ';
    for (const c of ['combustivel', 'bares', 'vestuario', 'presentes', 'mercado']) if (LOJA[c].some(k => L.includes(k))) return c;
    return null;
  }

  function categorizar(desc, loja, aprendido, extra, padrao) {
    const chave = norm(desc).trim();
    if (aprendido && aprendido[chave]) return aprendido[chave];
    const n = ' ' + chave.replace(/[^A-Z0-9$€&]+/g, ' ') + ' ';      // palavras separadas por espaço
    if (extra) for (const c in extra) if (extra[c].some(k => k && n.includes(' ' + norm(k).trim()))) return c;   // palavras-chave criadas por você
    const lc = lojaCat(loja);
    if (lc === 'bares') return 'bares';                   // bar ou restaurante: tudo é consumo fora
    for (const c of ORDEM) {
      if (c === 'bares' && lc === 'mercado') continue;     // cerveja do mercado é compra de casa
      if (KW[c].some(k => n.includes(' ' + k))) return c; // casa com o começo de uma palavra
    }
    // Pacote de palavras-chave padrão (vem pronto no primeiro acesso): palavra inteira, primeiro na descrição, depois no nome da loja.
    if (padrao) {
      const L = ' ' + norm(loja).replace(/[^A-Z0-9$€&]+/g, ' ') + ' ';
      for (const alvo of [n, L]) {          // vence a palavra-chave mais longa: "mercado livre" ganha de "mercado"
        let melhor = null, tam = 0;
        for (const c in padrao) for (let k of padrao[c]) { k = norm(k).replace(/[^A-Z0-9$€&]+/g, ' ').trim(); if (k && k.length > tam && alvo.includes(' ' + k + ' ')) { melhor = c; tam = k.length; } }
        if (melhor) return melhor;
      }
    }
    return lc || 'extra';
  }

  function lerData(t) {
    const m = t.match(/\b(\d{2})[\/.-](\d{2})[\/.-](\d{4}|\d{2})\b/);
    if (!m) return null;
    let [, d, mo, y] = m; if (y.length === 2) y = '20' + y;
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
    return `${y}-${mo}-${d}`;
  }

  function lerLoja(linhas) {
    for (const l of linhas.slice(0, 6)) {
      const n = norm(l).trim();
      if (n.length < 4 || /CNPJ|CUPOM|DOCUMENTO|NFC|NOTA|\d{2}\.\d{3}/.test(n)) continue;
      if ((n.match(/[A-Z]/g) || []).length < 4) continue;
      return l.replace(/\s{2,}/g, ' ').trim();
    }
    return '';
  }

  function lerTotal(linhas) {
    for (const l of linhas) {
      const n = norm(l);
      if (/(VALOR TOTAL|VALOR A PAGAR|TOTAL R\$|^\s*TOTAL\b)/.test(n) && !/SUB ?TOTAL|QTD|ITENS|TRIBUT/.test(n)) {
        const m = n.match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})/g);
        if (m) return money(m[m.length - 1]);
      }
    }
    return 0;
  }

  // QR da NFC-e: ...?p=CHAVE|2|1|1|HASH  (versão offline traz também o valor total)
  function lerQR(q) {
    if (!q) return null;
    const m = String(q).match(/p=([0-9]{44})/) || String(q).match(/\b(\d{44})\b/);
    return m ? m[1] : null;
  }


  // ---------- Contas de consumo (condomínio, água, luz, gás, IPTU) ----------
  const CONTAS = [
    ['Condomínio', /CONDOMINI|TAXA CONDOMINIAL|COTA CONDOMINIAL|ADMINISTRADORA DE CONDOM/],
    ['IPTU', /\bIPTU\b|IMPOSTO PREDIAL|IMPOSTO SOBRE A PROPRIEDADE PREDIAL/],
    ['Gás', /COMGAS|NATURGY|\bCEG\b|GASMIG|COPERGAS|BAHIAGAS|SULGAS|COMPAGAS|SCGAS|ULTRAGAZ|LIQUIGAS|SUPERGASBRAS|NACIONAL GAS|GAS NATURAL|GAS CANALIZADO|GAS ENCANADO|GLP 13|M3 DE GAS/],
    ['Água', /SABESP|COPASA|CEDAE|AGUAS DO RIO|\bIGUA SANEAMENTO|EMBASA|SANEPAR|CASAN|COMPESA|CAESB|CAGECE|CORSAN|SANEAGO|CAERN|CAGEPA|\bDESO\b|\bDMAE\b|\bSAAE\b|SANASA|BRK AMBIENTAL|AEGEA|AGUA E ESGOTO|CONSUMO DE AGUA|SANEAMENTO/],
    ['Luz', /\bENEL\b|CEMIG|CPFL|LIGHT SERVICOS|LIGHT S\.?A\b|COPEL|CELESC|EQUATORIAL|NEOENERGIA|COELBA|COSERN|CELPE|ELEKTRO|ENERGISA|\bEDP\b|\bRGE SUL\b|AMAZONAS ENERGIA|ENERGIA ELETRICA|FORNECIMENTO DE ENERGIA|CONSUMO DE ENERGIA|\bKWH\b/]
  ];
  function tipoConta(texto) {
    const n = norm(texto);
    for (const [nome, re] of CONTAS) if (re.test(n)) return nome;
    return null;
  }
  // Valor tirado da linha digitável (mais confiável que o texto, quando o OCR pega os números).
  function valorLinhaDigitavel(texto) {
    for (const l of String(texto).split(/\n/)) {
      const d = l.replace(/[^\d]/g, '');
      if (d.length === 48 && d[0] === '8') {            // arrecadação (água, luz, gás, IPTU)
        const cod = [0, 12, 24, 36].map(i => d.slice(i, i + 11)).join('');
        if ('6789'.includes(cod[2]) && cod[2] !== '8' && cod[2] !== '9') { const v = parseInt(cod.slice(4, 15), 10) / 100; if (v > 0) return v; }
      }
      if (d.length === 47) {                              // boleto bancário (condomínio)
        const v = parseInt(d.slice(37), 10) / 100; if (v > 0) return v;
      }
    }
    return 0;
  }
  function lerVencimento(texto) {
    const m = norm(texto).match(/VENC[A-Z.]*[^0-9]{0,25}(\d{2})[\/.-](\d{2})[\/.-](\d{4})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
  }
  function lerTotalConta(linhas) {
    for (const l of linhas) {
      const n = norm(l);
      if (/(TOTAL A PAGAR|VALOR A PAGAR|VALOR DO DOCUMENTO|VALOR COBRADO|\(=\) ?VALOR|VALOR TOTAL|TOTAL DA FATURA|TOTAL GERAL)/.test(n)) {
        const m = n.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/g);
        if (m) return money(m[m.length - 1]);
      }
    }
    return 0;
  }

  function interpretar(texto, aprendido, extra, padrao) {
    const linhas = String(texto || '').replace(/(\d)\s*[\/']\s*,?\s*(\d{2})\b/g, '$1,$2').replace(/(\d)\s?,\s(\d{2})\b/g, '$1,$2').split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const loja = lerLoja(linhas);
    const conta = tipoConta(texto);
    if (conta) {                         // conta de consumo: um lançamento só, com o valor da fatura
      const valor = valorLinhaDigitavel(texto) || lerTotalConta(linhas) || lerTotal(linhas);
      return { loja: loja || conta, data: lerVencimento(texto) || lerData(texto), total: valor, conta,
        itens: [{ descricao: 'Conta de ' + conta.toLowerCase() + (loja ? ' · ' + loja : ''), valor, categoria: 'contas' }] };
    }
    const itens = [];
    let fim = false, pend = null;          // pend: linha de descrição sem valor (cupom em duas linhas)
    for (const l of linhas) {
      const n = norm(l);
      if (/(SUB ?TOTAL|VALOR TOTAL|TOTAL R\$|^TOTAL\b|QTD\.? ?TOTAL DE ITENS)/.test(n)) fim = true;
      const m = n.match(VAL_RE);
      if (!m) {
        const d = limparDesc(l);
        pend = !fim && !NAO_ITEM.test(n) && (d.match(/[A-Za-zÀ-ú]/g) || []).length >= 3 ? d : null;
        continue;
      }
      if (DESC.test(n) && !/SEM DESC/.test(n)) { itens.push({ descricao: 'Desconto', valor: -Math.abs(money(m[1])), desconto: true }); pend = null; continue; }
      if (fim || NAO_ITEM.test(n)) { pend = null; continue; }
      let d = limparDesc(l);
      if ((d.match(/[A-Za-zÀ-ú]/g) || []).length < 3) { if (!pend) continue; d = pend; }
      pend = null;
      itens.push({ descricao: d, valor: money(m[1]) });
    }
    // Desconto vai para a categoria do maior grupo.
    itens.forEach(i => { if (!i.desconto) i.categoria = categorizar(i.descricao, loja, aprendido, extra, padrao); });
    const g = {}; itens.filter(i => !i.desconto).forEach(i => g[i.categoria] = (g[i.categoria] || 0) + i.valor);
    const maior = Object.keys(g).sort((a, b) => g[b] - g[a])[0] || 'extra';
    itens.forEach(i => { if (i.desconto) i.categoria = maior; delete i.desconto; });
    return { loja, data: lerData(texto), total: lerTotal(linhas), itens };
  }

  const api = { interpretar, categorizar, norm, lerQR, tipoConta, valorLinhaDigitavel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Cupom = api;
})(this);
