const E = require('../www/extrato.js');
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FALHOU:', m); } };
const hoje = new Date('2026-11-22T12:00:00');
const pdf = `NUBANK
Fatura de novembro
Vencimento: 05/12/2026
TRANSAÇÕES DE 28 OUT A 27 NOV
28 OUT Posto Shell Av Brasil 250,00
02 NOV Mercado Livre 2/5 89,90
05 NOV Uber *Trip 23,45
10 NOV Pagamento recebido 1.500,00
12 NOV Netflix.com 55,90
15/11 iFood *Restaurante 64,30
Total da fatura R$ 483,55`;
const r = E.porLinhas(pdf, hoje);
console.log(r);
ok(r.length === 6, 'qtd ' + r.length);
ok(r[0].data === '2026-10-28' && r[0].valor === 250, 'posto');
ok(r[1].descricao === 'Mercado Livre 2/5', 'parcela');
ok(r.find(i => /Pagamento/.test(i.descricao)).valor === -1500, 'pagamento vira credito');
ok(r[5].data === '2026-11-15', 'data com barra');
const dez = E.porLinhas('Vencimento: 10/01/2027\n20/12 Presente Loja 100,00\n05/01 Padaria 12,00\n06/01 Farmacia 30,00', hoje);
ok(dez[0].data === '2026-12-20' && dez[1].data === '2027-01-05', 'virada de ano ' + JSON.stringify(dez));
const o = E.ofx(`OFXHEADER:100\n<OFX><BANKTRANLIST><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261110120000[-3:BRT]<TRNAMT>-45.90<MEMO>COMPRA CARTAO PADARIA\n</STMTTRN><STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261105<TRNAMT>5000.00<MEMO>SALARIO</STMTTRN></BANKTRANLIST></OFX>`);
ok(o.length === 2 && o[0].valor === 45.9 && o[0].data === '2026-11-10' && o[1].valor === -5000, 'ofx ' + JSON.stringify(o));
const c = E.csv('Data;Descrição;Valor\n10/11/2026;Supermercado X;-123,45\n11/11/2026;Posto Ipiranga;-200,00\n12/11/2026;PIX recebido;300,00', hoje);
ok(c.length === 3 && c[0].valor === 123.45 && c[2].valor === -300, 'csv banco ' + JSON.stringify(c));
const c2 = E.csv('date,title,amount\n2026-11-10,Uber,23.90\n2026-11-11,Pagamento recebido,-500.00', hoje);
ok(c2.length === 2 && c2[0].valor === 23.9 && c2[0].data === '2026-11-10' && c2[1].valor === -500, 'csv nubank ' + JSON.stringify(c2));
ok(E.detectar('x.ofx', '<OFX>').tipo === 'ofx', 'detectar');
console.log(f ? f + ' falha(s)' : 'Todos os testes de fatura passaram'); process.exit(f ? 1 : 0);
