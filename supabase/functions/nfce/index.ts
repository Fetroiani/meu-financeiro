// Anotei Já: lê a página pública da NFC-e (o endereço que vem no QR Code do cupom fiscal)
// e devolve a loja, a data, o total e a lista de produtos.
//
// Por que existe: o site da Sefaz não deixa o navegador do celular ler a página direto (CORS),
// então o app pede para esta função buscar a página e separar os itens.
//
// Segurança:
// - só busca endereços de governo (terminados em .gov.br) e só a página da nota;
// - não grava nada: a nota passa por aqui e volta para o aparelho;
// - não usa nenhuma chave secreta.
//
// Para publicar pelo painel do Supabase: Edge Functions > Deploy a new function > Via Editor,
// nome "nfce", cole este arquivo inteiro e desligue "Verify JWT" (o app usa a chave publishable).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info, x-region',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------- leitura da página (também usada pelos testes em scripts/test-nfce.js) ----------
const ENT: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordf: 'ª', ordm: 'º', deg: '°' };
function entidades(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => {
      const k = n.toLowerCase();
      if (k in ENT) return ENT[k];
      const a = n.match(/^([a-z])(acute|grave|circ|tilde|cedil|uml)$/i);
      if (a) return (a[1] + { acute: '́', grave: '̀', circ: '̂', tilde: '̃', cedil: '̧', uml: '̈' }[a[2].toLowerCase() as 'acute']).normalize('NFC');
      return m;
    });
}
function texto(html: string): string {
  return entidades(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function dinheiro(s: string | undefined): number {
  if (!s) return 0;
  s = String(s).trim();
  const n = s.includes(',') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}
function quantidade(s: string | undefined): number {
  if (!s) return 1;
  const n = s.includes(',') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s);
  return isNaN(n) || n <= 0 ? 1 : Math.round(n * 1000) / 1000;
}
const VAL = '(\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d+\\.\\d{2})';

export type Item = { descricao: string; codigo: string; qtd: number; un: string; unitario: number; valor: number };
export type Nota = { loja: string; cnpj: string; data: string | null; hora: string; numero: string; chave: string; total: number; bruto: number; desconto: number; acrescimo: number; pagamento: string[]; bloqueio: boolean; itens: Item[] };

export function lerNota(html: string): Nota {
  const itens: Item[] = [];
  // Cada produto fica numa linha de tabela com "(Código: ...)" (modelo usado pela maioria das Sefaz, inclusive MG).
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
    const t = texto(tr);
    const m = t.match(/^(.*?)\s*\(\s*C[oó]d(?:igo)?\.?\s*:?\s*([^)]*)\)/i);
    if (!m || !m[1].trim()) continue;
    const descricao = m[1].replace(/^\d{1,3}\s*[-.)]\s*/, '').trim();
    const qtd = quantidade((t.match(/Qtde?\.?(?:\s*total\s*de\s*[ií]tens)?\s*:?\s*([\d.,]+)/i) || [])[1]);
    const un = ((t.match(/\bUN\s*:\s*([A-Za-z0-9]+)/) || [])[1] || '').toUpperCase();
    const unitario = dinheiro((t.match(/Vl\.?\s*Unit\.?\s*:?\s*(?:R\$)?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,4})?|\d+(?:\.\d{1,4})?)/i) || [])[1]);   // a Sefaz SP mostra "40,9" e "3"
    let valor = dinheiro((t.match(new RegExp('(?:Vl\\.?\\s*Total|Valor\\s*total(?:\\s*R\\$)?)\\s*:?\\s*(?:R\\$)?\\s*' + VAL, 'i')) || [])[1]);
    if (!valor) { const vs = t.match(new RegExp(VAL, 'g')); if (vs) valor = dinheiro(vs[vs.length - 1]); }
    if (!valor && unitario) valor = Math.round(unitario * qtd * 100) / 100;
    if (!valor) continue;
    itens.push({ descricao, codigo: m[2].trim(), qtd, un, unitario, valor });
  }
  const tudo = texto(html);
  // Nome da loja: bloco "txtTopo" (modelo nacional) ou o primeiro título em negrito (MG).
  let loja = '';
  const topo = html.match(/class=["'][^"']*txtTopo[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (topo) loja = texto(topo[1]);
  if (!loja) { const h = html.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i); if (h) loja = texto(h[1]); }
  if (!loja) { const r = tudo.match(/(?:Raz[aã]o Social|Nome \/ Raz[aã]o Social)\s*:?\s*(.+?)\s+(?:CNPJ|Nome Fantasia|Inscri)/i); if (r) loja = r[1]; }
  const cnpj = ((tudo.match(/CNPJ\s*:?\s*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i) || [])[1] || '').replace(/\D/g, '');
  let data: string | null = null, hora = '';
  const e = tudo.match(/Emiss[aã]o\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/i) || tudo.match(/\b(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)/);
  if (e) { data = `${e[3]}-${e[2]}-${e[1]}`; hora = e[4] ? (e[4].length === 5 ? e[4] + ':00' : e[4]) : ''; }
  const pega = (re: string) => dinheiro((tudo.match(new RegExp(re + '\\s*:?\\s*(?:R\\$)?\\s*' + VAL, 'i')) || [])[1]);
  const desconto = pega('Descontos?\\s*R\\$');
  const acrescimo = pega('(?:Acr[eé]scimos?|Outras\\s*despesas|Frete)\\s*R\\$');
  const ultimo = (re: string) => { const v = [...tudo.matchAll(new RegExp(re + '\\s*:?\\s*(?:R\\$)?\\s*' + VAL, 'gi'))]; return v.length ? dinheiro(v[v.length - 1][1]) : 0; };
  const total = pega('Valor\\s*a\\s*pagar\\s*R\\$') || pega('Valor\\s*pago\\s*R\\$') || ultimo('Valor\\s*total\\s*(?:da\\s*nota|R\\$)');
  const bruto = /tabResult|txtTopo/.test(html) ? pega('Valor\\s*total\\s*R\\$') : 0;   // no modelo nacional é o valor bruto dos itens
  const numero = (tudo.match(/N[uú]mero\s*:?\s*(\d{1,9})\b/i) || [])[1] || '';
  const chave = ((tudo.match(/Chave\s*de\s*acesso\s*:?\s*((?:\d\s*){44})/i) || [])[1] || '').replace(/\D/g, '');
  // Formas de pagamento: rótulos "tx" do modelo nacional; senão, nomes conhecidos depois de "Forma de pagamento".
  let pagamento: string[] = [...html.matchAll(/<label[^>]*class=["'][^"']*\btx\b[^"']*["'][^>]*>([\s\S]*?)<\/label>/gi)].map(x => texto(x[1])).filter(x => x && !/^troco\b/i.test(x));
  if (!pagamento.length) {
    const i = tudo.search(/Forma\s*de\s*pagamento/i);
    if (i >= 0) pagamento = [...tudo.slice(i, i + 400).matchAll(/(Dinheiro|Cart[aã]o\s*de\s*Cr[eé]dito|Cart[aã]o\s*de\s*D[eé]bito|PIX|Vale\s*Alimenta[cç][aã]o|Vale\s*Refei[cç][aã]o|Vale\s*Presente|Vale\s*Combust[ií]vel|Boleto|Cr[eé]dito\s*Loja|Transfer[eê]ncia|Outros)/gi)].map(x => x[1]);
  }
  pagamento = [...new Set(pagamento)];
  const bloqueio = /captcha|recaptcha|acesso\s*negado|muitas\s*requisi|tente\s*novamente\s*mais\s*tarde/i.test(tudo);
  return { loja: loja.replace(/\s{2,}/g, ' ').trim().slice(0, 120), cnpj, data, hora, numero, chave, total, bruto, desconto, acrescimo, pagamento, bloqueio, itens: itens.slice(0, 400) };
}

const UFS: Record<string, string> = { 11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF' };
const r2 = (n: number) => Math.round(n * 100) / 100;
const br = (n: number) => 'R$ ' + n.toFixed(2).replace('.', ',');

// Resposta no formato combinado (emitente, documento, itens, totais, observacoes). Nada é inventado:
// o que a página não mostra fica null e o motivo vai em observacoes.
export function notaEstruturada(html: string, endereco = '') {
  const n = lerNota(html);
  const daUrl = (decodeURIComponent((endereco.match(/[?&]p=([^&#]+)/i) || [])[1] || '').match(/^\d{44}/) || [])[0]
    || (endereco.match(/chNFe=(\d{44})/i) || [])[1] || '';
  const chave = n.chave.length === 44 ? n.chave : daUrl;
  const uf = chave ? UFS[chave.slice(0, 2)] || null : ((endereco.match(/\.([a-z]{2})\.gov\.br/i) || [])[1] || '').toUpperCase() || null;
  const numero = n.numero ? String(+n.numero) : chave ? String(+chave.slice(25, 34)) : null;
  const cnpj = n.cnpj || (chave ? chave.slice(6, 20) : '');
  const somaItens = r2(n.itens.reduce((a, i) => a + i.valor, 0));
  const subtotal = n.bruto || somaItens;
  const observacoes: string[] = [];
  if (!n.itens.length) {
    observacoes.push(n.bloqueio
      ? 'A Sefaz pediu verificação (CAPTCHA) ou bloqueou a consulta automática: os itens não vieram. Próximo passo: abrir o link da nota no navegador e fotografar o cupom ou colar o texto da página.'
      : 'A página da Sefaz não trouxe a tabela de itens. Próximo passo: abrir o link da nota no navegador e fotografar o cupom ou colar o texto da página.');
  } else {
    if (!n.total) observacoes.push('A página não mostrou o valor a pagar; valor_final ficou igual à soma dos itens.');
    const final = n.total || somaItens;
    const esperado = r2(subtotal - n.desconto + n.acrescimo);
    if (Math.abs(somaItens - final) > 0.009) {
      const dif = r2(somaItens - final);
      const motivo = n.desconto && Math.abs(esperado - final) <= 0.01 && Math.abs(subtotal - somaItens) <= 0.01 ? 'explicada pelo desconto da nota'
        : n.acrescimo && Math.abs(esperado - final) <= 0.01 ? 'explicada por acréscimo/frete' : 'sem explicação na página; confira a nota';
      observacoes.push(`A soma dos itens (${br(somaItens)}) difere do valor final (${br(final)}) em ${br(Math.abs(dif))}: ${motivo}.`);
    }
    if (n.acrescimo) observacoes.push(`Acréscimos/frete na nota: ${br(n.acrescimo)}.`);
  }
  if (!n.data) observacoes.push('A data de emissão não apareceu na página.');
  return {
    emitente: { nome: n.loja || null, cnpj: cnpj || null, uf },
    documento: { chave_acesso: chave || null, numero, data_emissao: n.data ? (n.hora ? `${n.data}T${n.hora}` : n.data) : null },
    itens: n.itens.map(i => ({ codigo: i.codigo || null, descricao: i.descricao.replace(/\s{2,}/g, ' '), quantidade: i.qtd, unidade: i.un || '', valor_unitario: i.unitario || r2(i.valor / (i.qtd || 1)), valor_total: i.valor })),
    totais: { subtotal, descontos: n.desconto, valor_final: n.itens.length ? (n.total || somaItens) : n.total, forma_pagamento: n.pagamento.length ? n.pagamento.join(', ') : null },
    observacoes,
  };
}

// Texto copiado da página da Sefaz (selecionar tudo > copiar no celular) vira um HTML simples que lerNota entende.
// Serve para os estados que recusam a consulta feita pelo servidor: o próprio aparelho abre a página e cola o texto no app.
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function textoParaHtml(t: string): string {
  const linhas = String(t || '').replace(/\r/g, '').split('\n').map(l => l.replace(/[\t ]+/g, ' ').trim()).filter(Boolean);
  const ehItem = (l: string) => /\(\s*C[oó]d(?:igo)?\.?\s*:?/i.test(l);
  const fim = (l: string) => /^(Qtd\.?\s*total|Qtde\s*total\s*de\s*[ií]tens\s*:\s*\d+\s*$|Valor\s*a\s*pagar|Valor\s*total\s*R\$\s*:?\s*R?\$?\s*[\d.,]+\s*$|Forma\s*de\s*pagamento|Descontos?\s*R\$|Informa[cç][aã]o\s*dos\s*Tributos)/i.test(l);
  const rows: string[] = [];
  let atual: string[] | null = null;
  for (const l of linhas) {
    if (ehItem(l)) { if (atual) rows.push(atual.join(' ')); atual = [l]; continue; }
    if (atual && fim(l)) { rows.push(atual.join(' ')); atual = null; continue; }
    if (atual) atual.push(l);
  }
  if (atual) rows.push(atual.join(' '));
  let loja = '';
  const iC = linhas.findIndex(l => /\bCNPJ\b/i.test(l));
  if (iC >= 0) { const antes = linhas[iC].split(/\bCNPJ\b/i)[0].trim(); loja = antes.length >= 3 ? antes : (iC > 0 && !/DOCUMENTO AUXILIAR|NOTA FISCAL/i.test(linhas[iC - 1]) ? linhas[iC - 1] : ''); }
  return (loja ? `<h4>${escHtml(loja)}</h4>` : '') + '<table>' + rows.map(r => `<tr><td>${escHtml(r)}</td></tr>`).join('') + '</table><div>' + escHtml(linhas.filter(l => !ehItem(l)).join('\n')) + '</div>';
}
export function notaDoTexto(t: string, endereco = '') { return notaEstruturada(textoParaHtml(t), endereco); }

// Só endereços de consulta da Sefaz.
export function enderecoPermitido(u: string): URL | null {
  let url: URL;
  try { url = new URL(u); } catch { return null; }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))) return null;
  const h = url.hostname.toLowerCase();
  if (!/^[a-z0-9.-]+\.gov\.br$/.test(h)) return null;
  return url;
}

function decodificar(buf: ArrayBuffer, tipo: string): string {
  let cs = (tipo.match(/charset=([\w-]+)/i) || [])[1];
  if (!cs) { const ini = new TextDecoder('latin1').decode(buf.slice(0, 4000)); cs = (ini.match(/charset=["']?([\w-]+)/i) || [])[1]; }
  try { return new TextDecoder((cs || 'utf-8').toLowerCase()).decode(buf); } catch { return new TextDecoder('utf-8').decode(buf); }
}

const CABECALHOS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};
export type Pagina = { html: string; status: number; tentativas: number };

// Busca a página. Alguns portais da Sefaz respondem a primeira visita só com um cookie de proteção:
// guardamos os cookies e tentamos de novo (até 3 vezes) quando a página vem sem a tabela de itens.
async function buscar(url: URL): Promise<Pagina> {
  const potes = new Map<string, string>();
  let ultima: Pagina = { html: '', status: 0, tentativas: 0 };
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    let atual = url;
    for (let i = 0; i < 6; i++) {   // segue redirecionamentos, mas só para endereços .gov.br
      const cookie = [...potes].map(([k, v]) => `${k}=${v}`).join('; ');
      const r = await fetch(atual, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { ...CABECALHOS, ...(cookie ? { Cookie: cookie } : {}) } });
      // deno-lint-ignore no-explicit-any
      const sc: string[] = (r.headers as any).getSetCookie ? (r.headers as any).getSetCookie() : [];
      for (const c of sc) { const m = c.match(/^\s*([^=;\s]+)=([^;]*)/); if (m) potes.set(m[1], m[2]); }
      if (r.status >= 300 && r.status < 400) {
        await r.body?.cancel();
        const prox = enderecoPermitido(new URL(r.headers.get('location') || '', atual).href);
        if (!prox) throw new Error('redirecionamento recusado');
        atual = prox; continue;
      }
      const buf = await r.arrayBuffer();
      if (buf.byteLength > 3_000_000) throw new Error('página grande demais');
      ultima = { html: decodificar(buf, r.headers.get('content-type') || ''), status: r.status, tentativas: tentativa };
      break;
    }
    if (ultima.status === 200 && /tabResult|\(\s*C[oó]digo/i.test(ultima.html)) return ultima;
    if (!potes.size && ultima.status === 200) break;   // sem cookie novo, outra tentativa daria o mesmo
    await new Promise(ok => setTimeout(ok, 400 * tentativa));
  }
  return ultima;
}

// Resumo do que a Sefaz devolveu, para entender quando os itens não vêm (sem dados pessoais: só o começo do texto visível).
export function diagnostico(p: Pagina) {
  const titulo = texto((p.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const corpo = texto(p.html.replace(/<head[\s\S]*?<\/head>/i, '')).slice(0, 300);
  return { status: p.status, tentativas: p.tentativas, tamanho: p.html.length, titulo, trecho: corpo, tabela: /tabResult/.test(p.html), script_protecao: /TSPD|ie9rgb4|_z\.Iol|bobcmn/i.test(p.html) };
}

function resposta(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
}

// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno;
if (D && D.serve) {
  D.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    if (req.method !== 'POST') return resposta({ erro: 'use POST' }, 405);
    let corpo: { url?: string };
    try { corpo = await req.json(); } catch { return resposta({ erro: 'pedido inválido' }, 400); }
    const url = enderecoPermitido(String(corpo.url || '').trim().slice(0, 1500));
    if (!url) return resposta({ erro: 'Este endereço não é de consulta de nota fiscal da Sefaz.' }, 400);
    try {
      const pagina = await buscar(url);
      const nota = notaEstruturada(pagina.html, url.href);
      if (!nota.itens.length) return resposta({ erro: 'A Sefaz não mostrou os produtos desta nota.', ...nota, diagnostico: diagnostico(pagina) }, 422);
      return resposta(nota);
    } catch (e) {
      return resposta({ erro: 'Não consegui abrir a nota no site da Sefaz (' + ((e as Error).message || e) + ').' }, 502);
    }
  });
}
