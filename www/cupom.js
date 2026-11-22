/* Meu Caixa: transforma o texto lido de um cupom fiscal em itens com categoria.
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
    bares: ['BAR ', ' BAR', 'BOTECO', 'CHOPERIA', 'CHOPPERIA', 'RESTAURANTE', 'LANCHONETE', 'PIZZARIA', 'CHURRASCARIA', 'PUB ',
      'CERVEJARIA', 'BISTRO', 'CAFETERIA', 'PADARIA E CONFEITARIA', 'SORVETERIA', 'HAMBURGUERIA', 'SUSHI', 'TEMAKERIA', 'BURGER', 'OUTBACK', 'MC DONALDS', 'MCDONALDS'],
    vestuario: ['RENNER', 'C&A', 'C & A', 'RIACHUELO', 'MARISA', 'HERING', 'ZARA', 'CENTAURO', 'NETSHOES', 'DECATHLON', 'CALCADOS',
      'MODAS', 'CONFECC', 'BOUTIQUE', 'ARTIGOS ESPORTIVOS', 'AREZZO', 'YOUCOM', 'PERNAMBUCANAS'],
    presentes: ['FLORICULTURA', 'BRINQUEDOS', 'RI HAPPY', 'PBKIDS', 'PRESENTES', 'CACAU SHOW', 'KOPENHAGEN'],
    mercado: ['SUPERMERCADO', 'SUPERMERCADOS', 'MERCADO', 'ATACAD', 'ASSAI', 'CARREFOUR', 'PAO DE ACUCAR', 'EXTRA ', 'DIA ', 'BIG ',
      'MAKRO', 'SAMS CLUB', 'HORTIFRUTI', 'SACOLAO', 'MERCEARIA', 'EMPORIO', 'FARMACIA', 'DROGARIA', 'DROGASIL', 'RAIA', 'PAGUE MENOS', 'PANIFICADORA', 'PADARIA']
  };
  const ORDEM = ['dolar', 'euro', 'investimentos', 'assinaturas', 'presentes', 'vestuario', 'bares', 'mercado'];

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
    for (const c of ['bares', 'vestuario', 'presentes', 'mercado']) if (LOJA[c].some(k => L.includes(k))) return c;
    return null;
  }

  function categorizar(desc, loja, aprendido) {
    const chave = norm(desc).trim();
    if (aprendido && aprendido[chave]) return aprendido[chave];
    const n = ' ' + chave.replace(/[^A-Z0-9$€&]+/g, ' ') + ' ';      // palavras separadas por espaço
    const lc = lojaCat(loja);
    if (lc === 'bares') return 'bares';                   // bar ou restaurante: tudo é consumo fora
    for (const c of ORDEM) {
      if (c === 'bares' && lc === 'mercado') continue;     // cerveja do mercado é compra de casa
      if (KW[c].some(k => n.includes(' ' + k))) return c; // casa com o começo de uma palavra
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

  function interpretar(texto, aprendido) {
    const linhas = String(texto || '').replace(/(\d)\s*[\/']\s*,?\s*(\d{2})\b/g, '$1,$2').replace(/(\d)\s?,\s(\d{2})\b/g, '$1,$2').split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const loja = lerLoja(linhas);
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
    itens.forEach(i => { if (!i.desconto) i.categoria = categorizar(i.descricao, loja, aprendido); });
    const g = {}; itens.filter(i => !i.desconto).forEach(i => g[i.categoria] = (g[i.categoria] || 0) + i.valor);
    const maior = Object.keys(g).sort((a, b) => g[b] - g[a])[0] || 'extra';
    itens.forEach(i => { if (i.desconto) i.categoria = maior; delete i.desconto; });
    return { loja, data: lerData(texto), total: lerTotal(linhas), itens };
  }

  const api = { interpretar, categorizar, norm, lerQR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Cupom = api;
})(this);
