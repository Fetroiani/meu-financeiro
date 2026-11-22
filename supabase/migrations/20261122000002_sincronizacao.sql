-- ============================================================================
-- ANOTEI JÁ - SINCRONIZAÇÃO ENTRE APARELHOS
-- O app guarda tudo no aparelho e sincroniza com estas tabelas quando há internet.
-- ============================================================================

-- 1. Controle de sincronização: quando mudou, se foi apagado e campos próprios do app
alter table public.categorias
  add column if not exists updated_at timestamp with time zone not null default now(),
  add column if not exists deleted boolean not null default false,
  add column if not exists extra jsonb not null default '{}'::jsonb;
alter table public.transacoes
  add column if not exists updated_at timestamp with time zone not null default now(),
  add column if not exists deleted boolean not null default false,
  add column if not exists extra jsonb not null default '{}'::jsonb;
alter table public.vencimentos
  add column if not exists updated_at timestamp with time zone not null default now(),
  add column if not exists deleted boolean not null default false,
  add column if not exists extra jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.categorias add constraint categorias_extra_tamanho check (pg_column_size(extra) <= 16384);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.transacoes add constraint transacoes_extra_tamanho check (pg_column_size(extra) <= 16384);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.vencimentos add constraint vencimentos_extra_tamanho check (pg_column_size(extra) <= 16384);
exception when duplicate_object then null; end $$;

-- updated_at sempre com o relógio do servidor (o do celular pode estar errado)
create or replace function public.anotei_ja_tocar_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists tocar_updated_at on public.categorias;
create trigger tocar_updated_at before insert or update on public.categorias
  for each row execute procedure public.anotei_ja_tocar_updated_at();
drop trigger if exists tocar_updated_at on public.transacoes;
create trigger tocar_updated_at before insert or update on public.transacoes
  for each row execute procedure public.anotei_ja_tocar_updated_at();
drop trigger if exists tocar_updated_at on public.vencimentos;
create trigger tocar_updated_at before insert or update on public.vencimentos
  for each row execute procedure public.anotei_ja_tocar_updated_at();

create index if not exists idx_categorias_sync on public.categorias (user_id, updated_at);
create index if not exists idx_transacoes_sync on public.transacoes (user_id, updated_at);
create index if not exists idx_vencimentos_sync on public.vencimentos (user_id, updated_at);

-- 2. Um lançamento ou vencimento só pode apontar para uma categoria do mesmo dono
create or replace function public.anotei_ja_checar_categoria()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.categoria_id is not null and not exists (
    select 1 from public.categorias c where c.id = new.categoria_id and c.user_id = new.user_id
  ) then
    raise exception 'categoria_id não pertence ao usuário' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists checar_categoria on public.transacoes;
create trigger checar_categoria before insert or update of categoria_id, user_id on public.transacoes
  for each row execute procedure public.anotei_ja_checar_categoria();
drop trigger if exists checar_categoria on public.vencimentos;
create trigger checar_categoria before insert or update of categoria_id, user_id on public.vencimentos
  for each row execute procedure public.anotei_ja_checar_categoria();

-- 3. Preferências do usuário (o que o leitor de cupom aprendeu, palavras de entrada etc.)
create table if not exists public.preferencias (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb check (pg_column_size(dados) <= 262144),
  updated_at timestamp with time zone not null default now()
);
alter table public.preferencias enable row level security;
alter table public.preferencias force row level security;
drop policy if exists "Preferencias: acesso restrito ao dono" on public.preferencias;
create policy "Preferencias: acesso restrito ao dono"
  on public.preferencias for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop trigger if exists tocar_updated_at on public.preferencias;
create trigger tocar_updated_at before insert or update on public.preferencias
  for each row execute procedure public.anotei_ja_tocar_updated_at();

-- 4. Permissões explícitas: só usuários logados acessam as tabelas pela API (visitantes, nada)
revoke all on public.categorias, public.transacoes, public.vencimentos, public.preferencias from anon;
grant select, insert, update, delete on public.categorias, public.transacoes, public.vencimentos, public.preferencias to authenticated;
