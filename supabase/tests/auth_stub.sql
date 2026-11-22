-- Imita o mínimo do Supabase (schema auth, auth.uid() e papéis) para testar o schema num Postgres comum.
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated, anon;
grant usage on schema public to authenticated, anon;
