-- ============================================================================
-- ANOTEI JÁ - "DÊ SUA OPINIÃO" DO SITE
-- Quem visita só consegue GRAVAR a própria opinião: ninguém lê, muda ou apaga
-- opiniões pelo site. Você vê a lista no painel do Supabase
-- (Table Editor > opinioes).
-- ============================================================================

create table if not exists public.opinioes (
  id uuid primary key default gen_random_uuid(),
  nota smallint not null check (nota between 1 and 5),
  mensagem text not null check (char_length(btrim(mensagem)) between 3 and 1000),
  nome text check (nome is null or char_length(nome) <= 120),
  email text check (email is null or (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  pagina text check (pagina is null or char_length(pagina) <= 40),
  criado_em timestamp with time zone not null default now()
);

alter table public.opinioes enable row level security;

revoke all on public.opinioes from anon, authenticated;
grant insert on public.opinioes to anon, authenticated;

drop policy if exists "site grava opiniao" on public.opinioes;
create policy "site grava opiniao" on public.opinioes
  for insert to anon, authenticated
  with check (criado_em > now() - interval '5 minutes' and criado_em < now() + interval '5 minutes');
