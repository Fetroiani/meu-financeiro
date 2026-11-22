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
