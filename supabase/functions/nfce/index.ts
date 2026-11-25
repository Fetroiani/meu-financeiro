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
export type Nota = { loja: string; cnpj: string; data: string | null; total: number; desconto: number; itens: Item[] };

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
    const unitario = dinheiro((t.match(new RegExp('Vl\\.?\\s*Unit\\.?\\s*:?\\s*(?:R\\$)?\\s*' + VAL, 'i')) || [])[1]);
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
  let data: string | null = null;
  const e = tudo.match(/Emiss[aã]o\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i) || tudo.match(/\b(\d{2})\/(\d{2})\/(\d{4})\s+\d{2}:\d{2}/);
  if (e) data = `${e[3]}-${e[2]}-${e[1]}`;
  const pega = (re: string) => dinheiro((tudo.match(new RegExp(re + '\\s*:?\\s*(?:R\\$)?\\s*' + VAL, 'i')) || [])[1]);
  const desconto = pega('Descontos?\\s*R\\$');
  const ultimo = (re: string) => { const v = [...tudo.matchAll(new RegExp(re + '\\s*:?\\s*(?:R\\$)?\\s*' + VAL, 'gi'))]; return v.length ? dinheiro(v[v.length - 1][1]) : 0; };
  const total = pega('Valor\\s*a\\s*pagar\\s*R\\$') || pega('Valor\\s*pago\\s*R\\$') || ultimo('Valor\\s*total\\s*(?:da\\s*nota|R\\$)');
  return { loja: loja.replace(/\s{2,}/g, ' ').trim().slice(0, 120), cnpj, data, total, desconto, itens: itens.slice(0, 400) };
}

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

async function buscar(url: URL): Promise<string> {
  let atual = url;
  for (let i = 0; i < 5; i++) {   // segue redirecionamentos, mas só para endereços .gov.br
    const r = await fetch(atual, {
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });
    if (r.status >= 300 && r.status < 400) {
      const prox = enderecoPermitido(new URL(r.headers.get('location') || '', atual).href);
      if (!prox) throw new Error('redirecionamento recusado');
      atual = prox; continue;
    }
    if (!r.ok) throw new Error('Sefaz respondeu ' + r.status);
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 3_000_000) throw new Error('página grande demais');
    return decodificar(buf, r.headers.get('content-type') || '');
  }
  throw new Error('redirecionamentos demais');
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
      const nota = lerNota(await buscar(url));
      if (!nota.itens.length) return resposta({ erro: 'A Sefaz não mostrou os produtos desta nota.', ...nota }, 422);
      return resposta(nota);
    } catch (e) {
      return resposta({ erro: 'Não consegui abrir a nota no site da Sefaz (' + ((e as Error).message || e) + ').' }, 502);
    }
  });
}
