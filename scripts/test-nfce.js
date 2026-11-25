// Testes da leitura da página da NFC-e (supabase/functions/nfce/index.ts)
// Rodar: node --experimental-strip-types scripts/test-nfce.js
const assert = require('assert');
(async () => {
  const { lerNota, enderecoPermitido } = await import('../supabase/functions/nfce/index.ts');

  // Modelo nacional (SP, RS, PR, BA, GO, RJ e outros)
  const sp = `<html><head><meta charset="utf-8"></head><body>
  <div id="conteudo"><div class="txtCenter"><div id="u20" class="txtTopo">SUPERMERCADO BOA COMPRA LTDA</div>
  <div class="text">CNPJ:\n 12.345.678/0001-90</div><div class="text">RUA DAS FLORES, 10, CENTRO, SAO PAULO, SP</div></div>
  <table id="tabResult" cellspacing="0" cellpadding="0" width="100%">
  <tr id="Item + 1"><td valign="top"><span class="txtTit">ARROZ TIO JO&Atilde;O 5KG</span><span class="RCod">(Código: 7893500018469 )</span><br />
  <span class="Rqtd"><strong>Qtde.:</strong>1</span><span class="RUN"><strong>UN: </strong>UN</span><span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;27,90</span></td>
  <td align="right" valign="top" class="txtTit noWrap">Vl. Total<br /><span class="valor">27,90</span></td></tr>
  <tr id="Item + 2"><td valign="top"><span class="txtTit">BANANA PRATA KG</span><span class="RCod">(Código: 2001 )</span><br />
  <span class="Rqtd"><strong>Qtde.:</strong>1,235</span><span class="RUN"><strong>UN: </strong>KG</span><span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;6,49</span></td>
  <td align="right" valign="top" class="txtTit noWrap">Vl. Total<br /><span class="valor">8,02</span></td></tr>
  <tr id="Item + 3"><td valign="top"><span class="txtTit">CERVEJA HEINEKEN LATA 350ML</span><span class="RCod">(Código: 7896045504831 )</span><br />
  <span class="Rqtd"><strong>Qtde.:</strong>6</span><span class="RUN"><strong>UN: </strong>UN</span><span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;4,59</span></td>
  <td align="right" valign="top" class="txtTit noWrap">Vl. Total<br /><span class="valor">27,54</span></td></tr>
  </table>
  <div id="totalNota" class="txtRight"><div id="linhaTotal"><label>Qtd. total de itens:</label><span class="totalNumb">3</span></div>
  <div id="linhaTotal"><label>Valor total R$:</label><span class="totalNumb">63,46</span></div>
  <div id="linhaTotal"><label>Descontos R$:</label><span class="totalNumb">2,00</span></div>
  <div id="linhaTotal" class="linhaShade"><label>Valor a pagar R$:</label><span class="totalNumb txtMax">61,46</span></div>
  <div id="linhaForma"><label>Forma de pagamento:</label><span class="totalNumb txtTitR">Valor pago R$:</span></div>
  <div id="linhaTotal"><label class="tx">Cartão de Débito</label><span class="totalNumb">61,46</span></div></div>
  <div id="infos"><ul><li><strong>Número: </strong>123456<strong> Série: </strong>1<strong> Emissão: </strong>24/11/2026 18:30:12-03:00 - Via Consumidor</li></ul></div>
  </div></body></html>`;
  const a = lerNota(sp);
  assert.strictEqual(a.loja, 'SUPERMERCADO BOA COMPRA LTDA');
  assert.strictEqual(a.cnpj, '12345678000190');
  assert.strictEqual(a.data, '2026-11-24');
  assert.strictEqual(a.total, 61.46);
  assert.strictEqual(a.desconto, 2);
  assert.strictEqual(a.itens.length, 3);
  assert.deepStrictEqual(a.itens[0], { descricao: 'ARROZ TIO JOÃO 5KG', codigo: '7893500018469', qtd: 1, un: 'UN', unitario: 27.9, valor: 27.9 });
  assert.strictEqual(a.itens[1].qtd, 1.235); assert.strictEqual(a.itens[1].un, 'KG'); assert.strictEqual(a.itens[1].valor, 8.02);
  assert.strictEqual(a.itens[2].valor, 27.54);

  // Modelo de Minas Gerais
  const mg = `<table class="table table-striped"><thead><tr><th class="text-center text-uppercase"><h4><b>PADARIA PAO QUENTE LTDA</b></h4></th></tr></thead>
  <tbody><tr><td>CNPJ: 11.222.333/0001-44, Inscrição Estadual: 123</td></tr></tbody></table>
  <table class="table table-striped"><tbody>
  <tr><td><h7>PAO FRANCES</h7>(Código: 10)</td><td>Qtde total de ítens: 0.5000</td><td>UN: KG</td><td>Valor total R$: R$ 9,95</td></tr>
  <tr><td><h7>LEITE INTEGRAL 1L</h7>(Código: 7891)</td><td>Qtde total de ítens: 2.0000</td><td>UN: UN</td><td>Valor total R$: R$ 11,98</td></tr>
  </tbody></table>
  <div>Qtde total de ítens: 2 Valor total R$: R$ 21,93</div>
  <table><tr><td>Emissão: 23/11/2026 08:05:00</td></tr></table>`;
  const b = lerNota(mg);
  assert.strictEqual(b.loja, 'PADARIA PAO QUENTE LTDA');
  assert.strictEqual(b.cnpj, '11222333000144');
  assert.strictEqual(b.data, '2026-11-23');
  assert.strictEqual(b.itens.length, 2);
  assert.strictEqual(b.itens[0].descricao, 'PAO FRANCES'); assert.strictEqual(b.itens[0].qtd, 0.5); assert.strictEqual(b.itens[0].valor, 9.95);
  assert.strictEqual(b.itens[1].valor, 11.98);
  assert.strictEqual(b.total, 21.93);

  // Página sem produtos (erro, captcha)
  assert.strictEqual(lerNota('<html><body>Captcha inválido</body></html>').itens.length, 0);

  // Só endereços .gov.br
  assert.ok(enderecoPermitido('https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=1|2|1|1|ABC'));
  assert.ok(enderecoPermitido('http://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=1'));
  for (const u of ['https://evil.com/?x=.gov.br', 'https://gov.br.evil.com/', 'file:///etc/passwd', 'https://a.gov.br:8080/', 'https://user:x@a.gov.br/', 'http://169.254.169.254/', 'nada'])
    assert.strictEqual(enderecoPermitido(u), null, u);
  console.log('test-nfce: ok');
})().catch(e => { console.error(e); process.exit(1); });
