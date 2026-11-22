/* Meu Caixa: lê faturas de cartão e extratos (PDF já convertido em texto, CSV, planilha, OFX)
   e devolve uma lista de lançamentos { data: 'AAAA-MM-DD', descricao, valor }.
   valor > 0 = gasto/débito; valor < 0 = crédito (pagamento, estorno, entrada). */
(function (root) {
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const MESES = { JAN: 1, FEV: 2, FEB: 2, MAR: 3, ABR: 4, APR: 4, MAI: 5, MAY: 5, JUN: 6, JUL: 7, AGO: 8, AUG: 8, SET: 9, SEP: 9, OUT: 10, OCT: 10, NOV: 11, DEZ: 12, DEC: 12 };
  const pad = n => String(n).padStart(2, '0');

  function valorBR(s) {
    s = String(s).replace(/R\$|\s/g, '');
    let neg = /^-|-$|^\(.*\)$/.test(s);
    s = s.replace(/[()\-+]/g, '');
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? null : Math.round((neg ? -n : n) * 100) / 100;
  }

  // Ano de referência: data de vencimento/fechamento no texto, senão o ano atual.
  function anoRef(texto, hoje) {
    const m = norm(texto).match(/(VENCIMENTO|FECHAMENTO|EMISSAO|PERIODO)[^0-9]{0,30}\d{2}[\/.-]\d{2}[\/.-](\d{4})/);
    return m ? +m[2] : (hoje || new Date()).getFullYear();
  }
  function montarData(d, m, y, ref, refMes) {
    if (!y) { y = ref; if (refMes && m > refMes + 1) y = ref - 1; }   // compra de dezembro numa fatura de janeiro
    else if (y < 100) y += 2000;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  // Linha de texto de fatura: "12/11 MERCADO LIVRE 2/5   123,45" ou "12 NOV UBER *TRIP 23,90"
  const RE_DATA = /^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\s+/;
  const RE_DATA_MES = /^(\d{1,2})\s+(JAN|FEV|FEB|MAR|ABR|APR|MAI|MAY|JUN|JUL|AGO|AUG|SET|SEP|OUT|OCT|NOV|DEZ|DEC)[A-Z]*\.?\s+/;
  const RE_VALOR = /\s(-?\s?(?:R\$\s?)?-?\(?\d{1,3}(?:\.\d{3})*,\d{2}\)?-?|-?\d+\.\d{2})\s*(?:D|C)?\s*$/;
  const IGNORAR = /(SALDO ANTERIOR|SALDO FINAL|SALDO DO DIA|SALDO EM|TOTAL DA FATURA|TOTAL DE|VALOR TOTAL|LIMITE|PAGAMENTO MINIMO|ENCARGOS|JUROS DO ROTATIVO|S A L D O)/;
  const CREDITO = /(PAGAMENTO|PGTO|ESTORNO|CREDITO|CR[EÉ]DITO|DEVOLU|REEMBOLSO|CASHBACK|ANUIDADE DIFERENCIADA ESTORNO)/;

  function porLinhas(texto, hoje) {
    const ref = anoRef(texto, hoje);
    const mv = norm(texto).match(/(VENCIMENTO|FECHAMENTO)[^0-9]{0,30}\d{2}[\/.-](\d{2})[\/.-]\d{4}/);
    const refMes = mv ? +mv[2] : null;
    const out = [];
    for (let l of String(texto).split(/\r?\n/)) {
      l = l.replace(/\s+/g, ' ').trim();
      const n = norm(l);
      if (!l || IGNORAR.test(n)) continue;
      let m = n.match(RE_DATA), d, mes, y, resto;
      if (m) { d = +m[1]; mes = +m[2]; y = m[3] ? +m[3] : null; resto = l.slice(m[0].length); }
      else if ((m = n.match(RE_DATA_MES))) { d = +m[1]; mes = MESES[m[2]]; y = null; resto = l.slice(m[0].length); }
      else continue;
      const v = (' ' + resto).match(RE_VALOR);
      if (!v) continue;
      let valor = valorBR(v[1]);
      if (valor === null || valor === 0) continue;
      if (/C\s*$/.test(resto) && !/D\s*$/.test(resto)) valor = -Math.abs(valor);
      let desc = (' ' + resto).slice(0, v.index).trim().replace(/\s{2,}/g, ' ');
      if ((desc.match(/[A-Za-zÀ-ú]/g) || []).length < 2) continue;
      if (CREDITO.test(norm(desc)) && valor > 0) valor = -valor;
      const data = montarData(d, mes, y, ref, refMes);
      if (data) out.push({ data, descricao: desc, valor });
    }
    return out;
  }

  function ofx(texto) {
    const out = [];
    const blocos = String(texto).split(/<STMTTRN>/i).slice(1);
    for (const b of blocos) {
      const tag = t => { const m = b.match(new RegExp('<' + t + '>([^<\\r\\n]+)', 'i')); return m ? m[1].trim() : ''; };
      const dt = tag('DTPOSTED'), amt = tag('TRNAMT');
      if (!dt || !amt) continue;
      const v = parseFloat(amt.replace(',', '.'));
      if (isNaN(v) || !v) continue;
      out.push({ data: `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`, descricao: (tag('MEMO') || tag('NAME') || 'Lançamento').replace(/\s{2,}/g, ' '), valor: Math.round(-v * 100) / 100 });
    }
    return out;   // no OFX, débito vem negativo: invertemos para "gasto positivo"
  }

  function separarCSV(linha, sep) {
    const r = []; let cur = '', q = false;
    for (let i = 0; i < linha.length; i++) {
      const ch = linha[i];
      if (ch === '"') { if (q && linha[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (ch === sep && !q) { r.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    r.push(cur.trim()); return r;
  }
  function lerDataCelula(s, hoje) {
    s = String(s).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = s.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?/); if (m) return montarData(+m[1], +m[2], m[3] ? +m[3] : null, (hoje || new Date()).getFullYear());
    return null;
  }
  // CSV / planilha: procura as colunas de data, descrição e valor pelo cabeçalho.
  function csv(texto, hoje) {
    const linhas = String(texto).split(/\r?\n/).filter(l => l.trim());
    if (!linhas.length) return [];
    const sep = [';', '\t', ','].sort((a, b) => linhas[0].split(b).length - linhas[0].split(a).length)[0];
    const rows = linhas.map(l => separarCSV(l, sep));
    let hi = rows.findIndex(r => r.some(c => /DATA|DATE/.test(norm(c))) && r.some(c => /VALOR|AMOUNT|VALUE|QUANTIA/.test(norm(c))));
    if (hi < 0) return porLinhas(rows.map(r => r.join(' ')).join('\n'), hoje);
    const h = rows[hi].map(norm);
    const iD = h.findIndex(c => /DATA|DATE/.test(c));
    const iT = h.findIndex(c => /DESCRI|HISTOR|LANCAMENTO|TITLE|ESTABELEC|NOME|MEMO/.test(c));
    const iV = h.findIndex(c => /VALOR|AMOUNT|VALUE|QUANTIA/.test(c) && !/DOLAR|USD|US\$/.test(c));
    const out = [];
    for (const r of rows.slice(hi + 1)) {
      const data = lerDataCelula(r[iD], hoje); const v = valorBR(r[iV] || '');
      if (!data || v === null || !v) continue;
      const desc = (iT >= 0 ? r[iT] : r.filter((_, i) => i !== iD && i !== iV).join(' ')).trim();
      if (IGNORAR.test(norm(desc))) continue;
      out.push({ data, descricao: desc || 'Lançamento', valor: v });
    }
    // Banco costuma exportar gasto negativo; fatura de cartão, positivo. Se quase tudo é negativo, invertemos.
    const neg = out.filter(i => i.valor < 0).length;
    if (neg > out.length * 0.6) out.forEach(i => i.valor = -i.valor);
    return out;
  }

  function detectar(nome, texto, hoje) {
    const n = String(nome || '').toLowerCase();
    if (/\.(ofx|qfx)$/.test(n) || /<OFX>|OFXHEADER/i.test(texto)) return { tipo: 'ofx', itens: ofx(texto) };
    if (/\.(csv|tsv)$/.test(n)) return { tipo: 'csv', itens: csv(texto, hoje) };
    return { tipo: 'texto', itens: porLinhas(texto, hoje) };
  }
  const pareceExtrato = (texto, hoje) => porLinhas(texto, hoje).length >= 3;

  const api = { detectar, porLinhas, ofx, csv, pareceExtrato, valorBR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Extrato = api;
})(this);
