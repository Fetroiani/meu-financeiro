/* Anotei Já: entende o que foi lido num QR Code ou código de barras.
   - QR Code da NFC-e / NF-e (cupom fiscal e nota fiscal): chave de acesso, CNPJ, data e, quando a nota traz, o valor total
   - Código de barras ou linha digitável de boleto bancário (47 dígitos) e de contas de consumo/tributos (48 dígitos)
   - QR Code Pix (copia e cola): valor e nome de quem recebe
   Tudo acontece no aparelho, sem internet. */
(function (root) {
  'use strict';
  const so = s => String(s || '').replace(/\D/g, '');
  const UF = { 11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF' };
  const BANCOS = { '001': 'Banco do Brasil', '033': 'Santander', '041': 'Banrisul', '070': 'BRB', '077': 'Inter', '104': 'Caixa', '208': 'BTG Pactual', '212': 'Banco Original', '237': 'Bradesco', '260': 'Nubank', '290': 'PagBank', '323': 'Mercado Pago', '336': 'C6 Bank', '341': 'Itaú', '380': 'PicPay', '389': 'Mercantil', '422': 'Safra', '633': 'Rendimento', '655': 'Votorantim', '707': 'Daycoval', '745': 'Citibank', '748': 'Sicredi', '756': 'Sicoob' };
  const SEGMENTO = { 1: 'Prefeitura', 2: 'Água', 3: 'Luz ou gás', 4: 'Telefone e internet', 5: 'Órgão público', 6: 'Carnê', 7: 'Multa de trânsito', 9: 'Conta' };

  const iso = d => d.toISOString().slice(0, 10);
  const hoje = () => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); };
  const fmtCNPJ = c => c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : c;

  // ---------- dígitos verificadores ----------
  function mod10(n) { let s = 0, p = 2; for (let i = n.length - 1; i >= 0; i--) { let v = +n[i] * p; if (v > 9) v = Math.floor(v / 10) + (v % 10); s += v; p = p === 2 ? 1 : 2; } const r = s % 10; return r === 0 ? 0 : 10 - r; }
  function mod11Boleto(n) { let s = 0, p = 2; for (let i = n.length - 1; i >= 0; i--) { s += +n[i] * p; p = p === 9 ? 2 : p + 1; } const r = 11 - (s % 11); return (r === 0 || r === 10 || r === 11) ? 1 : r; }
  function mod11Arrec(n) { let s = 0, p = 2; for (let i = n.length - 1; i >= 0; i--) { s += +n[i] * p; p = p === 9 ? 2 : p + 1; } const r = s % 11; return (r === 0 || r === 1) ? 0 : 11 - r; }
  function chaveValida(c) { if (!/^\d{44}$/.test(c)) return false; let s = 0, p = 2; for (let i = 42; i >= 0; i--) { s += +c[i] * p; p = p === 9 ? 2 : p + 1; } const r = s % 11; return (r < 2 ? 0 : 11 - r) === +c[43]; }

  // ---------- NFC-e / NF-e ----------
  function lerChave(c) {
    const aa = +c.slice(2, 4), mm = +c.slice(4, 6);
    return { chave: c, uf: UF[+c.slice(0, 2)] || '', ano: 2000 + aa, mes: mm, cnpj: c.slice(6, 20), modelo: c.slice(20, 22), serie: +c.slice(22, 25), numero: +c.slice(25, 34) };
  }
  function nota(raw) {
    const t = String(raw || '').trim();
    let chave = null, valor = 0, dia = 0, data = null;
    const p = t.match(/[?&]p=([^&#\s]+)/i);
    if (p) {
      const f = decodeURIComponent(p[1]).split('|');
      if (/^\d{44}$/.test(f[0])) {
        chave = f[0];
        // versão 2 offline: chave|2|amb|dia|valor|digVal|idToken|hash · versão 3 offline: chave|3|amb|dia|valor|...
        if ((f[1] === '2' && f.length >= 8) || (f[1] === '3' && f.length >= 5)) { dia = +f[3] || 0; valor = parseFloat(String(f[4]).replace(',', '.')) || 0; }
      }
    }
    if (!chave) { const q = t.match(/chNFe=(\d{44})/i); if (q) { chave = q[1]; const v = t.match(/vNF=([\d.,]+)/i); if (v) valor = parseFloat(v[1].replace(',', '.')) || 0; const h = t.match(/dhEmi=([0-9a-f]+)/i); if (h) { try { const s = h[1].match(/../g).map(x => String.fromCharCode(parseInt(x, 16))).join(''); if (/^\d{4}-\d\d-\d\d/.test(s)) data = s.slice(0, 10); } catch (e) {} } } }
    if (!chave) { const d = so(t); if (d.length === 44 && chaveValida(d) && /^(55|65)$/.test(d.slice(20, 22))) chave = d; }
    if (!chave) return null;
    const k = lerChave(chave);
    if (!data && dia >= 1 && dia <= 31) data = `${k.ano}-${String(k.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return { tipo: 'nfce', ...k, valor: Math.round(valor * 100) / 100, data, url: /^https?:\/\//i.test(t) ? t : '', cnpjFmt: fmtCNPJ(k.cnpj), nome: k.modelo === '55' ? 'Nota fiscal' : 'Cupom fiscal' };
  }

  // ---------- boletos e contas ----------
  function linhaParaBarras(d) {
    if (d.length === 47) return d.slice(0, 4) + d[32] + d.slice(33, 47) + d.slice(4, 9) + d.slice(10, 20) + d.slice(21, 31);
    if (d.length === 48 && d[0] === '8') return [0, 12, 24, 36].map(i => d.slice(i, i + 11)).join('');
    return d.length === 44 ? d : null;
  }
  function barrasParaLinha(b) {
    b = so(b); if (b.length !== 44) return b;
    if (b[0] === '8') { const m = '67'.includes(b[2]) ? mod10 : mod11Arrec; return [0, 11, 22, 33].map(i => { const p = b.slice(i, i + 11); return p + m(p); }).join(' '); }
    const c1 = b.slice(0, 4) + b.slice(19, 24), c2 = b.slice(24, 34), c3 = b.slice(34, 44);
    return `${c1.slice(0, 5)}.${c1.slice(5)}${mod10(c1)} ${c2.slice(0, 5)}.${c2.slice(5)}${mod10(c2)} ${c3.slice(0, 5)}.${c3.slice(5)}${mod10(c3)} ${b[4]} ${b.slice(5, 19)}`;
  }
  function vencFator(f) {
    if (!f) return null;
    const velho = new Date(Date.UTC(1997, 9, 7) + f * 864e5), novo = new Date(Date.UTC(2025, 1, 22) + (f - 1000) * 864e5), h = hoje();
    return iso(Math.abs(novo - h) < Math.abs(velho - h) ? novo : velho);
  }
  function dataNoCampo(s) { // contas de consumo costumam levar o vencimento AAAAMMDD no campo livre
    const h = hoje();
    for (let i = 0; i + 8 <= s.length; i++) {
      const y = +s.slice(i, i + 4), m = +s.slice(i + 4, i + 6), d = +s.slice(i + 6, i + 8);
      if (y < 2000 || m < 1 || m > 12 || d < 1 || d > 31) continue;
      const dt = new Date(Date.UTC(y, m - 1, d)); if (dt.getUTCDate() !== d) continue;
      if (Math.abs(dt - h) < 400 * 864e5) return iso(dt);
    }
    return null;
  }
  function boleto(raw) {
    const d = so(raw);
    if (![44, 47, 48].includes(d.length)) return null;
    const b = linhaParaBarras(d); if (!b) return null;
    if (b[0] === '8') {
      const id = b[2]; if (!'6789'.includes(id)) return null;
      const dv = +b[3], resto = b.slice(0, 3) + b.slice(4);
      if (('67'.includes(id) ? mod10(resto) : mod11Arrec(resto)) !== dv) return null;
      const seg = +b[1], valor = '68'.includes(id) ? parseInt(b.slice(4, 15), 10) / 100 : 0;
      return { tipo: 'conta', barras: b, segmento: seg, nome: SEGMENTO[seg] || 'Conta', valor, venc: dataNoCampo(b.slice(seg === 6 ? 23 : 19)), empresa: b.slice(15, seg === 6 ? 23 : 19) };
    }
    if (mod11Boleto(b.slice(0, 4) + b.slice(5)) !== +b[4]) return null;
    const banco = b.slice(0, 3);
    return { tipo: 'boleto', barras: b, banco, bancoNome: BANCOS[banco] || 'Banco ' + banco, valor: parseInt(b.slice(9, 19), 10) / 100, venc: vencFator(parseInt(b.slice(5, 9), 10)), nome: 'Boleto' };
  }

  // ---------- Pix ----------
  function tlv(s) { const o = {}; let i = 0; while (i + 4 <= s.length) { const t = s.slice(i, i + 2), n = parseInt(s.slice(i + 2, i + 4), 10); if (isNaN(n)) break; o[t] = s.slice(i + 4, i + 4 + n); i += 4 + n; } return o; }
  function pix(raw) {
    const s = String(raw || '').trim(); if (!/^000201/.test(s) || !/br\.gov\.bcb\.pix/i.test(s)) return null;
    const o = tlv(s); const v = parseFloat(o['54'] || '0') || 0;
    return { tipo: 'pix', valor: Math.round(v * 100) / 100, recebedor: (o['59'] || '').trim(), cidade: (o['60'] || '').trim(), nome: 'Pix' };
  }

  function interpretar(raw) {
    const t = String(raw || '').trim(); if (!t) return null;
    const p = pix(t); if (p) return p;
    const n = nota(t); if (n) return n;
    const b = boleto(t); if (b) return b;
    const d = so(t);
    if (/^\d{8}$|^\d{12,14}$/.test(t)) return { tipo: 'produto', codigo: t };
    if (/^https?:\/\//i.test(t)) return { tipo: 'link', url: t };
    if (d.length >= 44 && d.length <= 48) return { tipo: 'invalido', codigo: d };
    return { tipo: 'outro', texto: t.slice(0, 200) };
  }
  // procura dentro de um texto lido por OCR uma linha digitável válida
  function linhaNoTexto(texto) {
    for (const l of String(texto || '').split(/\n/)) { const d = so(l); if (d.length === 47 || d.length === 48) { const b = boleto(d); if (b) return b; } }
    const d = so(texto); for (const n of [48, 47]) for (let i = 0; i + n <= d.length; i++) { const b = boleto(d.slice(i, i + n)); if (b) return b; }
    return null;
  }

  const api = { interpretar, barrasParaLinha, nota, boleto, pix, linhaNoTexto, linhaParaBarras, vencFator, chaveValida, mod10, mod11Boleto, mod11Arrec, fmtCNPJ };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Codigos = api;
})(typeof self !== 'undefined' ? self : this);
