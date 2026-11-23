-- Teste de segurança do schema (roda no GitHub Actions num Postgres vazio, nunca no banco de produção).
\set ON_ERROR_STOP on
insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'a@teste'), ('22222222-2222-2222-2222-222222222222', 'b@teste');
do $$ begin
  if (select count(*) from public.categorias where user_id = '11111111-1111-1111-1111-111111111111') <> 9 then raise exception 'onboarding nao criou 9 categorias'; end if;
end $$;
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.transacoes (user_id, descricao, valor_brl, tipo) values ('11111111-1111-1111-1111-111111111111', 'Mercado', 10, 'gasto');
do $$ begin
  begin
    insert into public.transacoes (user_id, descricao, valor_brl, tipo) values ('22222222-2222-2222-2222-222222222222', 'x', 1, 'gasto');
    raise exception 'RLS deixou gravar para outro usuario';
  exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin
  if (select count(*) from public.transacoes) <> 0 then raise exception 'usuario B enxerga dados de A'; end if;
  if (select count(*) from public.categorias) <> 9 then raise exception 'usuario B deveria ver so as 9 categorias dele'; end if;
end $$;
-- integridade: B não pode apontar para a categoria de A
insert into public.preferencias (user_id, dados) values ('22222222-2222-2222-2222-222222222222', '{"aprendido": {}}');
reset role;
do $$ declare cat_a uuid; begin
  select id into cat_a from public.categorias where user_id = '11111111-1111-1111-1111-111111111111' limit 1;
  perform set_config('anotei.cat_a', cat_a::text, false);
end $$;
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin
  begin
    insert into public.transacoes (user_id, categoria_id, descricao, valor_brl, tipo)
      values ('22222222-2222-2222-2222-222222222222', current_setting('anotei.cat_a')::uuid, 'x', 1, 'gasto');
    raise exception 'aceitou categoria de outro usuario';
  exception when insufficient_privilege then null; end;
end $$;
-- updated_at muda sozinho e preferências são privadas
insert into public.transacoes (user_id, descricao, valor_brl, tipo) values ('22222222-2222-2222-2222-222222222222', 'Teste', 5, 'gasto');
select set_config('anotei.antes', (select updated_at::text from public.transacoes where descricao = 'Teste'), false);
select pg_sleep(0.02);
update public.transacoes set deleted = true where descricao = 'Teste';
do $$ begin
  if not (select updated_at from public.transacoes where descricao = 'Teste') > current_setting('anotei.antes')::timestamptz then raise exception 'updated_at nao mudou'; end if;
end $$;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$ begin if (select count(*) from public.preferencias) <> 0 then raise exception 'A enxerga preferencias de B'; end if; end $$;
reset role;
set role anon;
do $$ begin
  begin
    perform count(*) from public.categorias;
    raise exception 'anon conseguiu consultar a tabela';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'RLS ok';
-- cadastros do site: visitante só grava, não lê nem apaga
set role anon;
insert into public.cadastros (id, nome, celular, email, consentimento, plataforma)
  values ('33333333-3333-3333-3333-333333333333', 'Maria da Silva', '11987654321', 'maria@exemplo.com.br', true, 'android');
do $$ begin
  begin perform count(*) from public.cadastros; raise exception 'anon conseguiu ler cadastros';
  exception when insufficient_privilege then null; end;
  begin delete from public.cadastros; raise exception 'anon conseguiu apagar cadastros';
  exception when insufficient_privilege then null; end;
  begin insert into public.cadastros (nome, celular, email, consentimento) values ('Jo', '11987654321', 'x@y.com', true); raise exception 'aceitou nome curto';
  exception when check_violation then null; end;
  begin insert into public.cadastros (nome, celular, email, consentimento) values ('Maria', '123', 'x@y.com', true); raise exception 'aceitou celular invalido';
  exception when check_violation then null; end;
  begin insert into public.cadastros (nome, celular, email, consentimento) values ('Maria', '11987654321', 'sem-arroba', true); raise exception 'aceitou e-mail invalido';
  exception when check_violation then null; end;
  begin insert into public.cadastros (nome, celular, email, consentimento) values ('Maria', '11987654321', 'x@y.com', false); raise exception 'aceitou sem consentimento';
  exception when check_violation or insufficient_privilege then null; end;
end $$;
set role authenticated;
do $$ begin
  begin perform count(*) from public.cadastros; raise exception 'usuario logado conseguiu ler cadastros';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin if (select count(*) from public.cadastros) <> 1 then raise exception 'cadastro nao foi gravado'; end if; end $$;
select 'cadastros ok';
