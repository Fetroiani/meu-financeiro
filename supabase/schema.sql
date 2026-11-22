-- ============================================================================
-- ANOTEI JÁ - SCHEMA DE BANCO DE DADOS BLINDADO (SUPABASE / POSTGRESQL)
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. TABELA DE CATEGORIAS
create table if not exists public.categorias (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null check (char_length(trim(nome)) between 1 and 60),
  tipo text not null check (tipo in ('entrada', 'gasto')),
  cor text not null default '#00B4D8' check (cor ~* '^#[0-9a-f]{6}$'),
  icone text default 'category' check (char_length(icone) <= 40),
  palavras_chave text[] not null default '{}',
  meta_mensal numeric(12, 2) check (meta_mensal is null or meta_mensal > 0),
  subpastas text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABELA DE TRANSAÇÕES (ENTRADAS, GASTOS, PARCELAS E MOEDA ESTRANGEIRA)
create table if not exists public.transacoes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  categoria_id uuid references public.categorias(id) on delete set null,
  subpasta text check (subpasta is null or char_length(subpasta) <= 60),
  descricao text not null check (char_length(trim(descricao)) between 1 and 200),
  valor_brl numeric(12, 2) not null check (valor_brl > 0),
  valor_usd numeric(12, 2) check (valor_usd is null or valor_usd > 0),
  cotacao_usd numeric(10, 4) check (cotacao_usd is null or cotacao_usd > 0),
  tipo text not null check (tipo in ('entrada', 'gasto')),
  data_transacao date not null default current_date,
  pago boolean not null default true,
  parcela_atual integer not null default 1 check (parcela_atual >= 1),
  total_parcelas integer not null default 1 check (total_parcelas between 1 and 120 and parcela_atual <= total_parcelas),
  grupo_parcelamento_id uuid,
  observacao text check (observacao is null or char_length(observacao) <= 500),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE VENCIMENTOS E ALERTAS RECORRENTES
create table if not exists public.vencimentos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  categoria_id uuid references public.categorias(id) on delete set null,
  conta text not null check (char_length(trim(conta)) between 1 and 120),
  valor_estimado numeric(12, 2) check (valor_estimado is null or valor_estimado > 0),
  data_vencimento date not null,
  recorrencia text not null default 'mensal' check (recorrencia in ('mensal', 'anual', 'unica')),
  dias_aviso integer not null default 1 check (dias_aviso between 0 and 30),
  pago boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ÍNDICES DE PERFORMANCE
create index if not exists idx_categorias_user on public.categorias (user_id);
create index if not exists idx_transacoes_user_data on public.transacoes (user_id, data_transacao desc);
create index if not exists idx_transacoes_parcelamento on public.transacoes (user_id, grupo_parcelamento_id) where grupo_parcelamento_id is not null;
create index if not exists idx_vencimentos_user_data on public.vencimentos (user_id, data_vencimento asc);

-- 5. BLINDAGEM DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
alter table public.categorias enable row level security;
alter table public.transacoes enable row level security;
alter table public.vencimentos enable row level security;

alter table public.categorias force row level security;
alter table public.transacoes force row level security;
alter table public.vencimentos force row level security;

drop policy if exists "Categorias: acesso restrito ao dono" on public.categorias;
create policy "Categorias: acesso restrito ao dono"
  on public.categorias for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Transacoes: acesso restrito ao dono" on public.transacoes;
create policy "Transacoes: acesso restrito ao dono"
  on public.transacoes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Vencimentos: acesso restrito ao dono" on public.vencimentos;
create policy "Vencimentos: acesso restrito ao dono"
  on public.vencimentos for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. TRIGGER DE ONBOARDING (CRIA 9 CATEGORIAS E PALAVRAS-CHAVE NO CADASTRO)
create or replace function public.handle_new_user_anotei_ja()
returns trigger
language plpgsql
security definer
set search_path = public
as $$ begin insert into public.categorias (user_id, nome, tipo, cor, icone, palavras_chave) values (new.id, 'Alimentação', 'gasto', '#FF6B6B', 'restaurant', array['restaurante','ifood','padaria','lanche','cafe','almoco','jantar','pizza','hamburguer']), (new.id, 'Mercado', 'gasto', '#4ECDC4', 'shopping_cart', array['supermercado','mercado','atacadao','assai','carrefour','pao de acucar','hortifruti','acougue']), (new.id, 'Transporte', 'gasto', '#45B7D1', 'directions_car', array['uber','99','posto','gasolina','etanol','combustivel','estacionamento','pedagio','metro','onibus']), (new.id, 'Saúde', 'gasto', '#96CEB4', 'local_hospital', array['farmacia','drogaria','droga raia','drogasil','medico','consulta','exame','dentista','academia']), (new.id, 'Casa e Contas', 'gasto', '#FFEEAD', 'home', array['energia','luz','agua','gas','internet','aluguel','condominio','iptu','vivo','claro','tim','enel','comgas']), (new.id, 'Lazer e Assinaturas', 'gasto', '#D4A5A5', 'movie', array['cinema','netflix','spotify','amazon prime','ingresso','viagem','hotel','bar']), (new.id, 'Compras e Vestuário', 'gasto', '#9B59B6', 'shopping_bag', array['loja','shopping','roupa','calcado','tenis','mercado livre','amazon','shopee']), (new.id, 'Cartão de Crédito', 'gasto', '#34495E', 'credit_card', array['fatura','anuidade','cartao']), (new.id, 'Salário e Entradas', 'entrada', '#00C896', 'payments', array['salario','pix recebido','reembolso','rendimento','dividendos']);    return new; end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_anotei_ja();
