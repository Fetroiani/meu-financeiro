// Testa a sincronização com um "Supabase" de mentira em memória (dois aparelhos, uma conta).
const S = require('../www/sync.js');
let falhas = 0;
const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA', m); } else console.log('ok  ', m); };
const clone = o => JSON.parse(JSON.stringify(o));
const uuid = () => require('crypto').randomUUID();

// servidor falso: guarda linhas, carimba updated_at e devolve números como o PostgREST (numeric -> número)
function servidor(userId) {
  const db = { categorias: [], transacoes: [], vencimentos: [], preferencias: [] };
  let relogio = Date.parse('2026-11-22T12:00:00Z');
  const agora = () => new Date(relogio += 1000).toISOString();
  const NOMES = [['Alimentação', 'gasto'], ['Mercado', 'gasto'], ['Transporte', 'gasto'], ['Saúde', 'gasto'], ['Casa e Contas', 'gasto'], ['Lazer e Assinaturas', 'gasto'],
    ['Compras e Vestuário', 'gasto'], ['Cartão de Crédito', 'gasto'], ['Salário e Entradas', 'entrada']];
  for (const [nome, tipo] of NOMES) db.categorias.push({ id: uuid(), user_id: userId, nome, tipo, cor: '#FF6B6B', palavras_chave: ['x'], meta_mensal: null, subpastas: [], deleted: false, extra: {}, created_at: agora(), updated_at: agora() });
  const reordena = o => o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o).sort().reverse().reduce((r, k) => (r[k] = reordena(o[k]), r), {}) : Array.isArray(o) ? o.map(reordena) : o;
  function from(t) {
    const st = { filtros: [], de: 0, ate: 1e9 };
    const exec = () => {
      let l = db[t].filter(r => st.filtros.every(f => f(r)));
      l.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
      return { data: clone(l.slice(st.de, st.ate + 1)), error: null };
    };
    const b = {
      select() { return b; }, order() { return b; }, range(a, z) { st.de = a; st.ate = z; return b; },
      gt(c, v) { st.filtros.push(r => r[c] > v); return b; },
      in(c, ids) { st.filtros.push(r => ids.includes(r[c])); return b; },
      then(res, rej) { return Promise.resolve(st.upd ? (db[t].filter(r => st.filtros.every(f => f(r))).forEach(r => Object.assign(r, st.upd, { updated_at: agora() })), { error: null }) : exec()).then(res, rej); },
      async maybeSingle() { const d = exec().data; return { data: d[0] || null, error: null }; },
      async upsert(linhas, o) {
        for (const l0 of [].concat(linhas)) {
          const l = reordena(clone(l0)); const chave = o.onConflict;
          if (t !== 'preferencias' && l.valor_brl !== undefined && !(l.valor_brl > 0)) return { error: { message: 'check valor' } };
          if (l.categoria_id && !db.categorias.some(c => c.id === l.categoria_id)) return { error: { message: 'categoria inexistente ' + l.categoria_id } };
          const i = db[t].findIndex(r => r[chave] === l[chave]);
          if (i >= 0) Object.assign(db[t][i], l, { updated_at: agora() }); else db[t].push({ user_id: userId, created_at: agora(), ...l, updated_at: agora() });
        }
        return { error: null };
      },
      update(v) { st.upd = v; return b; },
    };
    return b;
  }
  return { from, db };
}

const NOVAS = [['alimentacao', 'Alimentação'], ['mercado', 'Mercado'], ['transporte', 'Transporte'], ['saude', 'Saúde'], ['contas', 'Casa e Contas'], ['lazer', 'Lazer e Assinaturas'],
  ['compras', 'Compras e Vestuário'], ['cartao', 'Cartão de Crédito'], ['extra', 'Outros']].map(([k, n]) => ({ k, n, c: '#00a884', kw: [k], ...(k === 'cartao' ? { subs: [] } : {}) }));
const novoAparelho = () => ({ TX: [], CATS: clone(NOVAS), ALERTAS: [], APR: {}, ENTKW: ['salario'], SEMPADRAO: [], PACOTE: 2, SYNC: {} });

if (require.main !== module) { module.exports = { servidor }; return; }
(async () => {
  const U = uuid(), sb = servidor(U);
  // Aparelho A, já em uso
  const A = novoAparelho();
  A.CATS.find(c => c.k === 'cartao').subs = [{ k: 's1', n: 'Nubank' }];
  A.CATS.find(c => c.k === 'mercado').meta = 800;
  A.TX.push({ id: 't1', ts: 1, tipo: 'despesa', desc: 'Supermercado Dia', valor: 132.1, data: '2026-11-15', cat: 'mercado', origem: 'cupom', loja: 'DIA', itens: [{ d: 'ARROZ', v: 20, c: 'mercado' }] });
  A.TX.push({ id: 't2', ts: 2, tipo: 'receita', desc: 'Salário', valor: 5000, data: '2026-11-05', cat: null, origem: 'manual' });
  A.TX.push({ id: 't3', ts: 3, tipo: 'despesa', desc: 'Hotel', valor: 550, data: '2026-11-20', cat: 'lazer', moeda: 'USD', valorMoeda: 100, origem: 'manual' });
  A.TX.push({ id: 't4', ts: 4, tipo: 'despesa', desc: 'Compra Loja (1/2)', valor: 300, data: '2026-11-22', cat: 'cartao', sub: 's1', cartao: 'Nubank', parc: { g: 'tabc', i: 1, n: 2, total: 600 }, origem: 'manual' });
  A.TX.push({ id: 't5', ts: 5, tipo: 'despesa', desc: 'Compra Loja (2/2)', valor: 300, data: '2026-12-22', cat: 'cartao', sub: 's1', cartao: 'Nubank', parc: { g: 'tabc', i: 2, n: 2, total: 600 }, origem: 'manual' });
  A.TX.push({ id: 't6', ts: 6, tipo: 'despesa', desc: 'Jantar em Paris', valor: 300, data: '2026-11-10', cat: 'lazer', moeda: 'EUR', valorMoeda: 50, origem: 'manual' });
  A.ALERTAS.push({ id: 'a1', nome: 'Aluguel', venc: '2026-11-30', valor: 1500, cat: 'contas', rep: 'mensal', avisar: 3, pago: false });
  A.ALERTAS.push({ id: 'a2', nome: 'Fatura do cartão Nubank', venc: '2026-12-05', valor: 600, cat: 'cartao', sub: 's1', rep: 'mensal', avisar: 3, pago: false, fatura: true });
  A.APR = { 'CERVEJA HEINEKEN': 'alimentacao' };
  let r = await S.sincronizar(sb, A, U);
  ok(sb.db.transacoes.length === 6 && sb.db.vencimentos.length === 2, 'A envia 6 lançamentos e 2 vencimentos');
  ok(sb.db.categorias.filter(c => !c.deleted).length === 10, 'categorias do cadastro casadas pelo nome + Outros (10 com Salário e Entradas): ' + sb.db.categorias.filter(c => !c.deleted).map(c => c.nome).join(', '));
  ok(sb.db.categorias.find(c => c.nome === 'Mercado').meta_mensal === 800, 'meta vai para o banco');
  const t4 = sb.db.transacoes.find(t => t.descricao.startsWith('Compra Loja (1/2)'));
  ok(S.ehUuid(t4.grupo_parcelamento_id) && t4.total_parcelas === 2 && t4.subpasta === 'Nubank', 'parcela com grupo uuid e subpasta');
  ok(sb.db.transacoes.find(t => t.descricao === 'Salário').categoria_id === sb.db.categorias.find(c => c.tipo === 'entrada').id, 'entrada aponta para Salário e Entradas');
  ok(sb.db.preferencias.length === 1 && sb.db.preferencias[0].dados.aprendido['CERVEJA HEINEKEN'] === 'alimentacao', 'preferências enviadas');
  r = await S.sincronizar(sb, A, U);
  ok(r.enviados === 0 && !r.recebeu, 'segunda sincronização sem mudanças não reenvia nada (enviados=' + r.enviados + ')');

  // Aparelho B, novo
  const B = novoAparelho();
  r = await S.sincronizar(sb, B, U);
  ok(B.TX.length === 6 && B.ALERTAS.length === 2, 'B recebe tudo');
  ok(B.CATS.map(c => c.n).join('|') === A.CATS.map(c => c.n).join('|'), 'B fica com as mesmas categorias na mesma ordem');
  ok(B.CATS.find(c => c.k === 'mercado').meta === 800 && B.CATS.find(c => c.k === 'cartao').subs[0].n === 'Nubank', 'meta e cartões chegam');
  const hb = B.TX.find(t => t.desc === 'Hotel'), jp = B.TX.find(t => t.desc === 'Jantar em Paris');
  ok(hb.moeda === 'USD' && hb.valorMoeda === 100 && jp.moeda === 'EUR' && jp.valorMoeda === 50, 'US$ e € preservados');
  const p2 = B.TX.find(t => t.desc === 'Compra Loja (2/2)');
  ok(p2.sub === 's1' && p2.parc.n === 2 && p2.parc.total === 600 && p2.cartao === 'Nubank', 'parcela com cartão chega igual');
  ok(B.TX.find(t => t.desc === 'Supermercado Dia').itens[0].d === 'ARROZ', 'itens do cupom chegam');
  ok(B.ALERTAS.find(a => a.nome.startsWith('Fatura')).fatura === true, 'alerta de fatura chega');
  ok(B.APR['CERVEJA HEINEKEN'] === 'alimentacao', 'o que o leitor aprendeu chega');
  r = await S.sincronizar(sb, B, U);
  ok(r.enviados === 0, 'B sem mudanças não reenvia (enviados=' + r.enviados + ')');

  // B edita, apaga e cria; A recebe
  B.TX.find(t => t.desc === 'Supermercado Dia').valor = 140;
  B.ALERTAS = B.ALERTAS.filter(a => a.nome !== 'Aluguel');
  B.TX.push({ id: 't9', ts: 9, tipo: 'despesa', desc: 'Uber', valor: 18.9, data: '2026-11-22', cat: 'transporte', origem: 'manual' });
  B.CATS.find(c => c.k === 'saude').n = 'Saúde e Farmácia';
  r = await S.sincronizar(sb, B, U);
  ok(r.enviados === 4, 'B envia 4 mudanças (enviados=' + r.enviados + ')');
  r = await S.sincronizar(sb, A, U);
  ok(A.TX.find(t => t.desc === 'Supermercado Dia').valor === 140, 'A recebe a edição');
  ok(!A.ALERTAS.some(a => a.nome === 'Aluguel'), 'A recebe a exclusão');
  ok(A.TX.some(t => t.desc === 'Uber' && t.cat === 'transporte'), 'A recebe o lançamento novo na categoria certa');
  ok(A.CATS.find(c => c.k === 'saude').n === 'Saúde e Farmácia', 'A recebe o novo nome da categoria');
  r = await S.sincronizar(sb, A, U);
  ok(r.enviados === 0, 'A estável depois de receber (enviados=' + r.enviados + ')');

  // conflito: os dois editam; vale quem sincroniza por último
  A.TX.find(t => t.desc === 'Uber').valor = 20; B.TX.find(t => t.desc === 'Uber').valor = 25;
  await S.sincronizar(sb, A, U); await S.sincronizar(sb, B, U); await S.sincronizar(sb, A, U);
  ok(A.TX.find(t => t.desc === 'Uber').valor === 25 && sb.db.transacoes.find(t => t.descricao === 'Uber').valor_brl === 25, 'conflito: vale a última sincronização');

  // aparelho com dados antigos (categorias antigas) entrando numa conta nova
  const U2 = uuid(), sb2 = servidor(U2);
  const C = { TX: [{ id: 'x1', tipo: 'despesa', desc: 'Chopp', valor: 30, data: '2026-11-01', cat: 'bares' }], CATS: [{ k: 'mercado', n: 'Mercado', c: '#00a86b' }, { k: 'bares', n: 'Bares', c: '#ff8a3d' }, { k: 'extra', n: 'Extra', c: '#8d8f8e' }], ALERTAS: [], APR: {}, ENTKW: [], SEMPADRAO: [], PACOTE: 1, SYNC: {} };
  await S.sincronizar(sb2, C, U2);
  ok(C.CATS.map(c => c.n).join('|') === 'Mercado|Bares|Extra', 'categorias antigas continuam as mesmas no aparelho');
  ok(sb2.db.categorias.filter(c => !c.deleted && c.tipo === 'gasto').map(c => c.nome).sort().join('|') === 'Bares|Extra|Mercado', 'categorias do cadastro que o aparelho não usa saem da conta');

  console.log(falhas ? falhas + ' falha(s)' : 'Todos os testes de sincronização passaram');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
