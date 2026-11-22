// Testes do leitor de cupom com textos parecidos com os que o OCR devolve.
const C = require('../www/cupom.js');
let falhas = 0;
const ok = (cond, msg) => { if (!cond) { falhas++; console.log('FALHOU:', msg); } };
const t1 = `SUPERMERCADO BOM PRECO LTDA
CNPJ: 12.345.678/0001-90
Rua das Flores, 100 - Centro
DOCUMENTO AUXILIAR DA NOTA FISCAL DE CONSUMIDOR ELETRONICA
# CODIGO DESCRICAO QTD UN VL UNIT VL TOTAL
001 7891234567890 ARROZ TIO JOAO 5KG 1 UN X 28,90 28,90
002 7896543210987 DETERGENTE YPE 500ML 2 UN X 1,70 3,40
003 7890000000001 CERVEJA HEINEKEN LN 6 UN X 7,50 45,00
004 7890000000002 CAMISETA BASICA M 1 UN X 49,90 49,90
005 7890000000003 CARTAO ANIVERSARIO 1 UN X 12,00 12,00
006 7890000000004 CARREGADOR USB 1 UN X 48,00 48,00
DESCONTO -5,00
QTD. TOTAL DE ITENS 6
VALOR TOTAL R$ 182,20
FORMA DE PAGAMENTO VALOR PAGO
Cartao de Credito 182,20
Tributos Totais Incidentes (Lei 12.741/2012) 35,12
Emissao: 21/11/2026 18:32:10`;
const r1 = C.interpretar(t1);
console.log(r1);
ok(r1.loja.startsWith('SUPERMERCADO'), 'loja');
ok(r1.data === '2026-11-21', 'data');
ok(r1.total === 182.2, 'total');
ok(r1.itens.length === 7, 'qtd itens ' + r1.itens.length);
const cat = d => (r1.itens.find(i => i.descricao.includes(d)) || {}).categoria;
ok(cat('ARROZ') === 'mercado', 'arroz');
ok(cat('HEINEKEN') === 'mercado', 'cerveja no mercado');
ok(cat('CAMISETA') === 'vestuario', 'camiseta');
ok(cat('CARTAO') === 'presentes', 'cartao');
ok(cat('CARREGADOR') === 'mercado', 'outros no mercado ficam mercado');
ok(r1.itens.find(i => i.valor < 0), 'desconto');
ok(Math.abs(r1.itens.reduce((a, i) => a + i.valor, 0) - 182.2) < .01, 'soma confere');
ok(!/7891234567890|1 UN/.test(cat && r1.itens[0].descricao), 'descricao limpa: ' + r1.itens[0].descricao);

const t2 = `BOTECO DO ZE BAR E RESTAURANTE
CNPJ 11.222.333/0001-44
1 CHOPP BRAHMA 300ML 3 x 9,90 29,70
2 PORCAO FRITAS 32,00
3 REFRIGERANTE LATA 6,50
TAXA DE SERVICO 10% 6,82
TOTAL 75,02
22/11/2026`;
const r2 = C.interpretar(t2);
console.log(r2);
ok(r2.itens.every(i => i.categoria === 'bares'), 'bar: tudo em bares');
ok(r2.itens.length === 4, 'bar itens ' + r2.itens.length);
ok(r2.total === 75.02, 'bar total');

const t3 = `LOJAS RENNER SA
CALCA JEANS SKINNY 159,90
MEIA SOQUETE KIT 3 29,90
SACOLA PRESENTE 4,00
TOTAL R$ 193,80`;
const r3 = C.interpretar(t3);
console.log(r3);
ok(r3.itens[0].categoria === 'vestuario' && r3.itens[2].categoria === 'presentes', 'renner');
ok(C.categorizar('ARROZ 5KG', 'Loja X', { 'ARROZ 5KG': 'extra' }) === 'extra', 'aprendido');
ok(C.lerQR('https://www.fazenda.sp.gov.br/nfce/qrcode?p=35261112345678000190650010000123451000123456|2|1|1|ABC') === '35261112345678000190650010000123451000123456', 'qr');
const t4 = `SUPERMERCADO BOM PRECO LTDA
* DESCRICAO QTD VL TOTAL
001 ARROZ TIO JOAO 5KG

1 UN X 28,90             28,90
002 BANANA PRATA KG
1,215 KG X 6,99           8,49
QTD. TOTAL DE ITENS              2
VALOR TOTAL R$              37/,39`;
const r4 = C.interpretar(t4);
ok(r4.itens.length === 2 && r4.itens[0].descricao.startsWith('ARROZ') && r4.itens[1].valor === 8.49, 'cupom em duas linhas: ' + JSON.stringify(r4.itens));
ok(r4.total === 37.39, 'total com erro de OCR');
const t5 = `ENEL DISTRIBUICAO SAO PAULO
NOTA FISCAL / CONTA DE ENERGIA ELETRICA
CONSUMO 245 KWH
VENCIMENTO 10/12/2026
TOTAL A PAGAR R$ 198,37
83660000001-0 98370048100-5 12345678901-2 34567890123-4`;
const r5 = C.interpretar(t5);
ok(r5.conta === 'Luz' && r5.itens.length === 1 && r5.itens[0].categoria === 'contas', 'conta de luz ' + JSON.stringify(r5));
ok(r5.total === 198.37, 'valor da conta ' + r5.total);
ok(r5.data === '2026-12-10', 'vencimento');
ok(C.valorLinhaDigitavel('83660000001-0 98370048100-5 12345678901-2 34567890123-4') === 198.37, 'linha digitavel concessionaria');
ok(C.valorLinhaDigitavel('23793.38128 60000.000003 00000.000400 1 98760000045090') === 450.9, 'linha digitavel boleto');
ok(C.tipoConta('SABESP - CIA DE SANEAMENTO BASICO') === 'Água', 'agua');
ok(C.tipoConta('CONDOMINIO EDIFICIO SOLAR - BOLETO') === 'Condomínio', 'condominio');
ok(C.tipoConta('PREFEITURA DE SP - IPTU 2026') === 'IPTU', 'iptu');
ok(C.tipoConta('COMGAS') === 'Gás', 'gas');
ok(C.categorizar('AGUA MINERAL 1,5L', 'SUPERMERCADO X') === 'mercado', 'agua mineral continua mercado');
ok(C.tipoConta(t1) === null, 'cupom de mercado nao e conta');
ok(C.tipoConta('SUPERMERCADO X\nREFRIG COCA LIGHT 2L 9,90\nMAIONESE LIGHT 7,50') === null, 'produto light nao vira conta de luz');
// pacote de palavras-chave do primeiro acesso: só vale quando o leitor não reconhece o item, e por palavra inteira
const PAD = { alimentacao: ['ifood', 'cafe', 'lanche'], transporte: ['uber', '99'], saude: ['drogaria', 'drogasil'], contas: ['agua', 'gas', 'vivo'], lazer: ['bar'] };
ok(C.categorizar('IFOOD *RESTAURANTE', '', {}, {}, PAD) === 'alimentacao', 'ifood na fatura vai para alimentacao');
ok(C.categorizar('UBER *TRIP', '', {}, {}, PAD) === 'transporte', 'uber vai para transporte');
ok(C.categorizar('CAFE PILAO 500G', 'SUPERMERCADO BOM', {}, {}, PAD) === 'mercado', 'cafe do mercado continua mercado');
ok(C.categorizar('AGUA MINERAL 1,5L', 'SUPERMERCADO', {}, {}, PAD) === 'mercado', 'agua mineral nao vira conta de agua');
ok(C.categorizar('DIPIRONA 500MG', 'DROGARIA SAO PAULO', {}, {}, PAD) === 'saude', 'item de drogaria vai para saude pelo nome da loja');
ok(C.categorizar('BARRA CEREAL', 'SUPERMERCADO', {}, {}, PAD) === 'mercado', 'bar nao casa com barra');
ok(C.categorizar('COMPRA X', 'MERCADO LIVRE', {}, {}, { mercado: ['mercado'], compras: ['mercado livre'] }) === 'compras', 'palavra-chave mais longa vence');
console.log(falhas ? falhas + ' falha(s)' : 'Todos os testes passaram');
process.exit(falhas ? 1 : 0);
