/* Anotei Já: sincronização entre aparelhos pelo Supabase.
   O app continua guardando tudo no aparelho (criptografado). Quando há login e internet,
   este módulo envia o que mudou e recebe o que mudou em outro aparelho.

   Como descobre o que mudou sem marcar cada alteração: guarda a "impressão" (hash) de cada
   registro como estava na última sincronização (base). Registro local diferente da base = enviar.
   Registro que sumiu do aparelho mas está na base = apagado (envia deleted = true).
   Registro do servidor que mudou e não foi mexido aqui = aplicar no aparelho. */
(function (root) {
  const uuid = () => (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : require('crypto').randomUUID());
  const ehUuid = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''));
  const nk = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const corOk = c => (/^#[0-9a-f]{6}$/i.test(c || '') ? String(c).toLowerCase() : '#00b4d8');
  const corta = (s, n) => Array.from(String(s || '')).slice(0, n).join('');
  // forma canônica: chaves em ordem (o jsonb do Postgres reordena) e sem campos vazios
  const canon = v => Array.isArray(v) ? v.map(canon) : (v && typeof v === 'object')
    ? Object.keys(v).sort().reduce((o, k) => { const x = v[k]; if (x !== undefined && x !== null && x !== '') o[k] = canon(x); return o; }, {}) : v;
  const hash = row => JSON.stringify(canon(row));
  // Categorias criadas pelo banco no cadastro (sem extra.k) casam com as do app pelo nome.
  const POR_NOME = { 'alimentacao': 'alimentacao', 'mercado': 'mercado', 'transporte': 'transporte', 'saude': 'saude', 'casa e contas': 'contas',
    'conta de consumo': 'contas', 'lazer e assinaturas': 'lazer', 'compras e vestuario': 'compras', 'cartao de credito': 'cartao', 'outros': 'extra', 'extra': 'extra',
    'bares': 'bares', 'vestuario': 'vestuario', 'assinaturas': 'assinaturas', 'presentes': 'presentes', 'investimentos': 'investimentos', 'dolar': 'dolar', 'euro': 'euro', 'combustivel': 'combustivel' };
  const TABELAS = ['categorias', 'transacoes', 'vencimentos'];

  /* ---------- aparelho -> linhas do banco ---------- */
  // Garante id de nuvem (rid) em tudo e grupos de parcela em formato uuid. Muda o estado no lugar.
  function prepararIds(e) {
    for (const c of e.CATS) if (!ehUuid(c.rid)) c.rid = uuid();
    if (!ehUuid(e.SYNC.entRid)) e.SYNC.entRid = uuid();
    const grupos = {};
    for (const t of e.TX) {
      if (!ehUuid(t.rid)) t.rid = uuid();
      if (t.parc && !ehUuid(t.parc.g)) t.parc.g = grupos[t.parc.g] || (grupos[t.parc.g] = uuid());
    }
    for (const a of e.ALERTAS) if (!ehUuid(a.rid)) a.rid = uuid();
  }
  function linhasLocais(e) {
    const catRid = k => (e.CATS.find(c => c.k === k) || {}).rid || null;
    const subNome = (k, s) => { const c = e.CATS.find(x => x.k === k); const su = c && (c.subs || []).find(x => x.k === s); return su ? corta(su.n, 60) : null; };
    const out = { categorias: [], transacoes: [], vencimentos: [] };
    e.CATS.forEach((c, i) => out.categorias.push({
      id: c.rid, nome: corta(c.n, 60) || 'Categoria', tipo: 'gasto', cor: corOk(c.c), palavras_chave: (c.kw || []).map(String),
      meta_mensal: c.meta > 0 ? Math.round(c.meta * 100) / 100 : null, subpastas: (c.subs || []).map(s => corta(s.n, 60)), deleted: false,
      extra: { k: c.k, ordem: i, subs: c.subs && c.subs.length ? c.subs : undefined }
    }));
    out.categorias.push({ id: e.SYNC.entRid, nome: 'Salário e Entradas', tipo: 'entrada', cor: '#00c896', palavras_chave: (e.ENTKW || []).map(String),
      meta_mensal: null, subpastas: [], deleted: false, extra: { k: 'receita' } });
    for (const t of e.TX) {
      const v = Math.round((+t.valor || 0) * 100) / 100;
      if (!(v > 0) || !t.data) continue;                       // o banco exige valor > 0 e data
      const rec = t.tipo === 'receita', usd = t.moeda === 'USD' && t.valorMoeda > 0;
      out.transacoes.push({
        id: t.rid, categoria_id: rec ? e.SYNC.entRid : catRid(t.cat), subpasta: rec ? null : subNome(t.cat, t.sub),
        descricao: corta((t.desc || '').trim() || 'Lançamento', 200), valor_brl: v,
        valor_usd: usd ? Math.round(t.valorMoeda * 100) / 100 : null, cotacao_usd: usd ? Math.round(v / t.valorMoeda * 10000) / 10000 : null,
        tipo: rec ? 'entrada' : 'gasto', data_transacao: t.data, pago: true,
        parcela_atual: t.parc ? t.parc.i : 1, total_parcelas: t.parc ? t.parc.n : 1, grupo_parcelamento_id: t.parc ? t.parc.g : null, deleted: false,
        extra: { id: t.id, cat: t.cat || undefined, sub: t.sub, ts: t.ts, origem: t.origem, loja: t.loja, cartao: t.cartao, itens: t.itens && t.itens.length ? t.itens : undefined,
          moeda: usd ? undefined : t.moeda, valorMoeda: usd ? undefined : t.valorMoeda, parcTotal: t.parc ? t.parc.total : undefined }
      });
    }
    for (const a of e.ALERTAS) {
      if (!a.venc) continue;
      out.vencimentos.push({
        id: a.rid, categoria_id: catRid(a.cat), conta: corta((a.nome || '').trim() || 'Conta', 120),
        valor_estimado: a.valor > 0 ? Math.round(a.valor * 100) / 100 : null, data_vencimento: a.venc,
        recorrencia: a.rep === 'mensal' ? 'mensal' : a.rep === 'anual' ? 'anual' : 'unica',
        dias_aviso: Math.max(0, Math.min(30, a.avisar ?? 3)), pago: !!a.pago, deleted: false,
        extra: { id: a.id, cat: a.cat, sub: a.sub, fatura: a.fatura || undefined, estimado: a.estimado || undefined, pagoEm: a.pagoEm, auto: a.auto || undefined }
      });
    }
    return out;
  }
  const prefsLocais = e => ({ dados: { aprendido: e.APR || {}, entKw: e.ENTKW || [], semPadrao: e.SEMPADRAO || [], pacote: e.PACOTE || 2 } });

  /* ---------- linhas do banco -> aparelho ---------- */
  const so = r => { const o = {}; for (const k of ['id', 'nome', 'tipo', 'cor', 'palavras_chave', 'meta_mensal', 'subpastas', 'categoria_id', 'subpasta', 'descricao', 'valor_brl', 'valor_usd', 'cotacao_usd', 'data_transacao', 'pago', 'parcela_atual', 'total_parcelas', 'grupo_parcelamento_id', 'conta', 'valor_estimado', 'data_vencimento', 'recorrencia', 'dias_aviso', 'deleted', 'extra']) if (k in r) o[k] = r[k]; return o; };
  const num = v => (v === null || v === undefined ? null : +v);
  function normRemota(t, r) {          // mesmo formato de linhasLocais, para comparar hashes
    const o = so(r);
    for (const k of ['meta_mensal', 'valor_brl', 'valor_usd', 'cotacao_usd', 'valor_estimado']) if (k in o) o[k] = num(o[k]);
    if (o.cor) o.cor = String(o.cor).toLowerCase();
    if (o.data_transacao) o.data_transacao = String(o.data_transacao).slice(0, 10);
    if (o.data_vencimento) o.data_vencimento = String(o.data_vencimento).slice(0, 10);
    o.extra = o.extra || {};
    return o;
  }
  function catDaLinha(r, existente) {
    const x = r.extra || {};
    const subsNomes = r.subpastas || [];
    let subs = Array.isArray(x.subs) ? x.subs.filter(s => subsNomes.includes(corta(s.n, 60))) : [];
    for (const n of subsNomes) if (!subs.some(s => corta(s.n, 60) === n)) subs.push({ k: 's' + uuid().slice(0, 8), n });
    const c = { ...(existente || {}), k: x.k || (existente && existente.k) || POR_NOME[nk(r.nome)] || 'c' + r.id.slice(0, 8), n: r.nome, c: r.cor, rid: r.id };
    if ((r.palavras_chave || []).length) c.kw = r.palavras_chave.slice(); else delete c.kw;
    if (r.meta_mensal > 0) c.meta = +r.meta_mensal; else delete c.meta;
    if (subs.length || c.k === 'cartao') c.subs = subs; else delete c.subs;
    return c;
  }
  function txDaLinha(r, e, existente) {
    const x = r.extra || {}, rec = r.tipo === 'entrada';
    const cat = rec ? null : ((e.CATS.find(c => c.rid === r.categoria_id) || {}).k || x.cat || 'extra');
    const c = e.CATS.find(k => k.k === cat);
    let sub = x.sub;
    if (r.subpasta && c && c.subs) { const s = c.subs.find(s => corta(s.n, 60) === r.subpasta); if (s) sub = s.k; }
    const t = { id: (existente && existente.id) || x.id || r.id, rid: r.id, ts: x.ts || Date.parse(r.created_at || '') || Date.now(), tipo: rec ? 'receita' : 'despesa',
      desc: r.descricao, valor: +r.valor_brl, data: String(r.data_transacao).slice(0, 10), cat, origem: x.origem || 'manual' };
    if (sub && !rec) t.sub = sub;
    for (const k of ['loja', 'cartao', 'itens']) if (x[k]) t[k] = x[k];
    if (r.valor_usd > 0) { t.moeda = 'USD'; t.valorMoeda = +r.valor_usd } else if (x.moeda) { t.moeda = x.moeda; t.valorMoeda = x.valorMoeda }
    if (r.total_parcelas > 1) t.parc = { g: r.grupo_parcelamento_id, i: r.parcela_atual, n: r.total_parcelas, total: x.parcTotal };
    return t;
  }
  function alertaDaLinha(r, e, existente) {
    const x = r.extra || {};
    const a = { id: (existente && existente.id) || x.id || r.id, rid: r.id, nome: r.conta, venc: String(r.data_vencimento).slice(0, 10), valor: num(r.valor_estimado) || 0,
      cat: (e.CATS.find(c => c.rid === r.categoria_id) || {}).k || x.cat || 'extra', rep: r.recorrencia === 'unica' ? '' : r.recorrencia, avisar: r.dias_aviso, pago: !!r.pago };
    for (const k of ['sub', 'fatura', 'estimado', 'pagoEm', 'auto']) if (x[k] !== undefined && x[k] !== null) a[k] = x[k];
    return a;
  }

  /* ---------- mesclagem ---------- */
  // e: estado do aparelho (muda no lugar). remotas: {tabela: [linhas]} com o que mudou no servidor.
  // primeira: primeira sincronização deste aparelho com esta conta.
  // Devolve { enviar: {tabela: [linhas]}, apagar: {tabela: [ids]}, mudou: bool }.
  function mesclar(e, remotas, primeira) {
    const base = e.SYNC.base || (e.SYNC.base = {});
    let mudou = false;
    // 1) primeira vez: casa categorias do aparelho com as da conta (pela chave interna ou pelo nome)
    const ignorar = new Set();
    if (primeira) {
      e.SYNC.tab = e.SYNC.tab || {};
      // aparelho novo (sem lançamentos) entrando numa conta já usada: fica com as categorias da conta
      const contaUsada = (remotas.categorias || []).some(r => !r.deleted && r.tipo === 'gasto' && (r.extra || {}).k);
      if (contaUsada && !e.TX.length && !e.ALERTAS.length) { e.CATS = []; mudou = true; }
      let temEntrada = false;
      for (const r0 of (remotas.categorias || []).filter(r => !r.deleted)) {
        const r = normRemota('categorias', r0), doApp = !!(r.extra || {}).k;
        if (r.tipo === 'entrada') {
          if (temEntrada) continue;
          temEntrada = true;
          e.SYNC.entRid = r.id;
          if (doApp) e.ENTKW = (r.palavras_chave || []).slice();
          base[r.id] = hash(r); ignorar.add(r.id); mudou = true;
          continue;
        }
        const k = (r.extra || {}).k || POR_NOME[nk(r.nome)];
        const loc = e.CATS.find(c => !c.casou && ((k && c.k === k) || nk(c.n) === nk(r.nome)));
        if (!loc) {
          // categoria criada pelo cadastro que este aparelho não usa: sai da conta; as que vieram de outro aparelho entram aqui
          if (!doApp) { base[r.id] = hash(r); e.SYNC.tab[r.id] = 'categorias'; ignorar.add(r.id); }
          continue;
        }
        loc.casou = true; loc.rid = r.id; mudou = true;
        // a que já veio de outro aparelho (tem extra.k) vale a do servidor; a criada pelo cadastro, vale a do aparelho
        if (doApp) Object.assign(loc, catDaLinha(r, loc));
        base[r.id] = hash(r); ignorar.add(r.id);
      }
      e.CATS.forEach(c => delete c.casou);
    }
    prepararIds(e);
    // 2) aplica o que veio do servidor quando o aparelho não mexeu no mesmo registro
    const locais = linhasLocais(e);
    const hashLocal = {};
    for (const t of TABELAS) for (const l of locais[t]) hashLocal[l.id] = hash(l);
    const ordem = ['categorias', 'transacoes', 'vencimentos'];
    for (const tab of ordem) for (const r0 of remotas[tab] || []) {
      if (ignorar.has(r0.id)) continue;
      const r = normRemota(tab, r0), h = hash(r);
      // mexido aqui desde a última sincronização (editado ou apagado): a versão do aparelho vale
      const mexeuAqui = base[r.id] !== undefined && hashLocal[r.id] !== base[r.id];
      const novoAqui = hashLocal[r.id] !== undefined && base[r.id] === undefined && !primeira;
      if (mexeuAqui || novoAqui) continue;                 // a mudança do aparelho vai por cima (é enviada logo abaixo)
      if (hashLocal[r.id] === h) { base[r.id] = h; continue; }
      if (tab === 'categorias') {
        if (r.tipo === 'entrada') { if (r.deleted) { delete base[r.id]; continue; } e.SYNC.entRid = r.id; e.ENTKW = (r.palavras_chave || []).slice(); base[r.id] = h; mudou = true; continue; }
        const i = e.CATS.findIndex(c => c.rid === r.id);
        if (r.deleted) { if (i >= 0) { e.CATS.splice(i, 1); mudou = true; } delete base[r.id]; continue; }
        const c = catDaLinha(r, i >= 0 ? e.CATS[i] : null);
        if (i >= 0) e.CATS[i] = c; else e.CATS.push(c);
        c._ordem = (r.extra || {}).ordem;
      } else {
        const lista = tab === 'transacoes' ? e.TX : e.ALERTAS;
        const i = lista.findIndex(x => x.rid === r.id);
        if (r.deleted) { if (i >= 0) { lista.splice(i, 1); mudou = true; } delete base[r.id]; continue; }
        const novo = tab === 'transacoes' ? txDaLinha(r, e, i >= 0 ? lista[i] : null) : alertaDaLinha(r, e, i >= 0 ? lista[i] : null);
        if (i >= 0) lista[i] = novo; else lista.push(novo);
      }
      base[r.id] = h; mudou = true;
    }
    // ordem das categorias como no outro aparelho; "Outros" sempre por último
    if (e.CATS.some(c => c._ordem !== undefined)) {
      e.CATS.forEach((c, i) => { if (c._ordem === undefined) c._ordem = i; });
      e.CATS.sort((a, b) => (a.k === 'extra') - (b.k === 'extra') || a._ordem - b._ordem);
    }
    e.CATS.forEach(c => delete c._ordem);
    // 3) o que mudou no aparelho vai para o servidor; o que sumiu daqui é apagado lá
    const depois = linhasLocais(e), enviar = {}, apagar = {}, vivos = new Set();
    for (const t of TABELAS) {
      enviar[t] = []; apagar[t] = [];
      for (const l of depois[t]) { vivos.add(l.id); if (base[l.id] !== hash(l)) enviar[t].push(l); }
    }
    const tabDe = {};
    for (const t of TABELAS) for (const r of remotas[t] || []) tabDe[r.id] = t;
    for (const id of Object.keys(base)) if (!vivos.has(id) && id !== 'prefs') {
      const t = (e.SYNC.tab && e.SYNC.tab[id]) || tabDe[id];
      if (t) apagar[t].push(id); else delete base[id];
    }
    return { enviar, apagar, mudou, hashes: Object.fromEntries(TABELAS.flatMap(t => depois[t].map(l => [l.id, hash(l)]))), tabelas: Object.fromEntries(TABELAS.flatMap(t => depois[t].map(l => [l.id, t]))) };
  }

  /* ---------- conversa com o Supabase ---------- */
  async function buscarMudancas(sb, desde) {
    const out = {};
    for (const t of TABELAS) {
      out[t] = [];
      for (let de = 0; ; de += 1000) {
        let q = sb.from(t).select('*').order('updated_at', { ascending: true }).range(de, de + 999);
        if (desde) q = q.gt('updated_at', desde);
        const { data, error } = await q;
        if (error) throw error;
        out[t].push(...data);
        if (data.length < 1000) break;
      }
    }
    const { data: pref, error } = await sb.from('preferencias').select('*').maybeSingle();
    if (error) throw error;
    out.preferencias = pref;
    return out;
  }
  const maior = (a, b) => (!a ? b : !b ? a : (a > b ? a : b));

  // estado: {TX, CATS, ALERTAS, APR, ENTKW, SEMPADRAO, PACOTE, SYNC}. Muda no lugar.
  async function sincronizar(sb, e, userId) {
    e.SYNC = e.SYNC || {};
    const primeira = e.SYNC.user !== userId;
    if (primeira) e.SYNC = { user: userId, base: {}, tab: {} };
    // 5 s de folga: uma gravação que terminou agora pode ter horário um pouco anterior
    const desde = primeira || !e.SYNC.last ? null : new Date(Date.parse(e.SYNC.last) - 5000).toISOString();
    const remotas = await buscarMudancas(sb, desde);
    let ultimo = e.SYNC.last;
    for (const t of TABELAS) for (const r of remotas[t]) ultimo = maior(ultimo, r.updated_at);
    const m = mesclar(e, remotas, primeira);
    // preferências: o servidor vale se o aparelho não mexeu desde a última vez
    const pl = prefsLocais(e), hp = JSON.stringify(pl.dados);
    const rp = remotas.preferencias;
    if (rp && hash(rp.dados) !== hash(pl.dados) && (e.SYNC.base.prefs === hp || (primeira && !Object.keys(e.APR || {}).length))) {
      const d = rp.dados || {};
      if (d.aprendido) e.APR = d.aprendido;
      if (Array.isArray(d.semPadrao)) e.SEMPADRAO = d.semPadrao;
      e.SYNC.base.prefs = JSON.stringify(prefsLocais(e).dados); m.mudou = true;
    }
    // envia: categorias antes (os lançamentos apontam para elas)
    let enviados = 0;
    for (const t of TABELAS) {
      const linhas = m.enviar[t];
      for (let i = 0; i < linhas.length; i += 500) {
        const { error } = await sb.from(t).upsert(linhas.slice(i, i + 500), { onConflict: 'id' });
        if (error) throw error;
      }
      for (const l of linhas) e.SYNC.base[l.id] = m.hashes[l.id];
      enviados += linhas.length;
    }
    for (const t of TABELAS.slice().reverse()) {
      const ids = m.apagar[t];
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await sb.from(t).update({ deleted: true }).in('id', ids.slice(i, i + 200));
        if (error) throw error;
      }
      for (const id of ids) delete e.SYNC.base[id];
      enviados += ids.length;
    }
    e.SYNC.tab = m.tabelas;
    const hp2 = JSON.stringify(prefsLocais(e).dados);
    if (e.SYNC.base.prefs !== hp2) {
      const { error } = await sb.from('preferencias').upsert({ user_id: userId, dados: JSON.parse(hp2) }, { onConflict: 'user_id' });
      if (error) throw error;
      e.SYNC.base.prefs = hp2; enviados++;
    }
    e.SYNC.last = ultimo || new Date(0).toISOString();
    return { recebeu: m.mudou, enviados };
  }

  const api = { sincronizar, mesclar, linhasLocais, prepararIds, hash, ehUuid };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Sync = api;
})(this);
