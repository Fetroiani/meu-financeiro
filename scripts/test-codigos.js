// Testes do leitor de QR Code e código de barras (node scripts/test-codigos.js)
const C = require('../www/codigos.js');
let falhas = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA ') + m); if (!c) falhas++; };
// boleto bancário: monta o código de barras com DV e a linha digitável correspondente
function boletoBarras(banco, fator, valorCent, livre) {
  const sem = banco + '9' + String(fator).padStart(4, '0') + String(valorCent).padStart(10, '0') + livre;
  const dv = C.mod11Boleto(sem); return sem.slice(0, 4) + dv + sem.slice(4);
}
function linhaDe(b) {
  const c1 = b.slice(0, 4) + b.slice(19, 24), c2 = b.slice(24, 34), c3 = b.slice(34, 44);
  return c1 + C.mod10(c1) + c2 + C.mod10(c2) + c3 + C.mod10(c3) + b[4] + b.slice(5, 19);
}
const livre = '1234567890123456789012345';
const fator = 1000 + Math.round((Date.UTC(2026, 11, 10) - Date.UTC(2025, 1, 22)) / 864e5);
const b = boletoBarras('341', fator, 25990, livre);
const r1 = C.boleto(b);
ok(r1 && r1.tipo === 'boleto' && r1.valor === 259.9 && r1.bancoNome === 'Itaú' && r1.venc === '2026-12-10', 'boleto pelo código de barras: ' + JSON.stringify(r1 && [r1.valor, r1.venc, r1.bancoNome]));
const ld = linhaDe(b);
const r2 = C.interpretar(ld.replace(/^(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d)(\d{14})$/, '$1.$2 $3.$4 $5.$6 $7 $8'));
ok(r2 && r2.barras === b && r2.valor === 259.9, 'boleto pela linha digitável com pontos e espaços');
ok(C.boleto(b.slice(0, 10) + ((+b[10] + 1) % 10) + b.slice(11)) === null, 'boleto com dígito errado é recusado');
ok(C.vencFator(1000) === '2025-02-22' && C.vencFator(9999) === '2025-02-21', 'fator de vencimento antigo e novo: ' + C.vencFator(9999));
// conta de consumo (arrecadação): segmento 3 (luz), valor efetivo (6), vencimento AAAAMMDD no campo livre
const corpo = '836' + '00000015790' + '0123' + '20261205' + '98765432109876543';
const semDv = corpo.slice(0, 3) + corpo.slice(3);
const arr = corpo.slice(0, 3) + C.mod10(semDv) + corpo.slice(3);
const r3 = C.boleto(arr);
ok(r3 && r3.tipo === 'conta' && r3.nome === 'Luz ou gás' && r3.valor === 157.9 && r3.venc === '2026-12-05', 'conta de luz pelo código de barras: ' + JSON.stringify(r3 && [r3.nome, r3.valor, r3.venc]));
const linha48 = [0, 11, 22, 33].map(i => { const p = arr.slice(i, i + 11); return p + C.mod10(p); }).join('');
const r4 = C.interpretar(linha48);
ok(r4 && r4.barras === arr, 'conta pela linha digitável de 48 dígitos');
ok(C.linhaNoTexto('Pague até 05/12\nLinha: ' + linha48.replace(/(\d{12})/g, '$1 ') + '\nObrigado').valor === 157.9, 'acha a linha digitável dentro do texto lido da foto');
// NFC-e
function chave(base43) { let s = 0, p = 2; for (let i = 42; i >= 0; i--) { s += +base43[i] * p; p = p === 9 ? 2 : p + 1; } const r = s % 11; return base43 + (r < 2 ? 0 : 11 - r); }
const ch = chave('35' + '2611' + '12345678000190' + '65' + '001' + '000012345' + '1' + '12345678');
ok(C.chaveValida(ch), 'chave de acesso válida');
const q1 = C.interpretar('https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=' + ch + '|2|1|1|ABCDEF0123');
ok(q1 && q1.tipo === 'nfce' && q1.uf === 'SP' && q1.cnpjFmt === '12.345.678/0001-90' && q1.valor === 0 && q1.nome === 'Cupom fiscal', 'QR da NFC-e online (sem valor): ' + JSON.stringify(q1 && [q1.uf, q1.cnpjFmt, q1.mes, q1.ano]));
const q2 = C.interpretar('http://nfce.sefaz.pe.gov.br/nfce/consulta?p=' + ch + '|2|1|18|87.45|6e6a|1|ABC');
ok(q2 && q2.valor === 87.45 && q2.data === '2026-11-18', 'QR da NFC-e offline traz valor e dia: ' + JSON.stringify(q2 && [q2.valor, q2.data]));
const q3 = C.interpretar('https://x.gov.br/qrcode?chNFe=' + ch + '&nVersao=100&tpAmb=1&dhEmi=' + Buffer.from('2026-11-20T10:00:00-03:00').toString('hex') + '&vNF=12.30&vICMS=0');
ok(q3 && q3.valor === 12.3 && q3.data === '2026-11-20', 'QR antigo (versão 1) com chNFe, vNF e dhEmi');
ok(C.interpretar(ch).tipo === 'nfce', 'chave de 44 dígitos digitada');
// Pix
const pixTxt = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865406123.455802BR5913Fulano de Tal6008BRASILIA62070503***6304ABCD';
const p = C.interpretar(pixTxt);
ok(p && p.tipo === 'pix' && p.valor === 123.45 && p.recebedor === 'Fulano de Tal', 'QR Code Pix: ' + JSON.stringify(p && [p.valor, p.recebedor]));
ok(C.interpretar('7891000315507').tipo === 'produto', 'código de produto (EAN) é reconhecido como produto');
ok(C.interpretar(b.slice(0, 43) + '1').tipo !== 'boleto', 'código de 44 dígitos inválido não vira boleto');
ok(C.barrasParaLinha(b).replace(/\D/g, '') === ld, 'código de barras vira linha digitável de novo (boleto)');
ok(C.barrasParaLinha(arr).replace(/\D/g, '') === linha48, 'código de barras vira linha digitável de novo (conta)');
if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); } else console.log('Todos os testes de códigos passaram');
