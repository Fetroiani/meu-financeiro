-- Teste de segurança do schema (roda no GitHub Actions num Postgres vazio, nunca no banco de produção).
\set ON_ERROR_STOP on
grant select, insert, update, delete on all tables in schema public to authenticated, anon;
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
reset role;
set role anon;
do $$ begin if (select count(*) from public.categorias) <> 0 then raise exception 'anon enxerga dados'; end if; end $$;
reset role;
select 'RLS ok';
