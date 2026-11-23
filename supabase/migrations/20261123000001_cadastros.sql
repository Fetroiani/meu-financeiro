-- ============================================================================
-- ANOTEI JÁ - CADASTRO DE QUEM ABRE O APP PELO SITE
-- O site pede nome, celular e e-mail antes de liberar o link do app.
-- Quem visita só consegue GRAVAR o próprio cadastro: ninguém consegue ler,
-- mudar ou apagar cadastros pelo site. Você vê a lista no painel do Supabase
-- (Table Editor > cadastros), que usa a sua conta de administrador.
-- ============================================================================

create table if not exists public.cadastros (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 3 and 120),
  celular text not null check (celular ~ '^[0-9]{10,13}$'),
  email text not null check (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consentimento boolean not null check (consentimento),
  plataforma text check (plataforma is null or char_length(plataforma) <= 20),
  criado_em timestamp with time zone not null default now()
);

alter table public.cadastros enable row level security;

revoke all on public.cadastros from anon, authenticated;
grant insert on public.cadastros to anon, authenticated;

drop policy if exists "site grava cadastro" on public.cadastros;
create policy "site grava cadastro" on public.cadastros
  for insert to anon, authenticated
  with check (consentimento and criado_em > now() - interval '5 minutes' and criado_em < now() + interval '5 minutes');

create index if not exists cadastros_email_idx on public.cadastros (lower(email));
