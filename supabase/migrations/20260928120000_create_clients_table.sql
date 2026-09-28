-- ---------------------------------------------------------------------------
-- Carteira de clientes da consultoria (tela /clientes).
--
-- Guarda a inscrição feita no modal "+ Novo cliente":
--   logo (arquivo no bucket client-logos) · nome fantasia · razão social
--   CNPJ · segmento · e-mail · contato (DDD + número)
--
-- A migration é IDEMPOTENTE: a tabela e o bucket já existem no Lovable Cloud,
-- então cada passo confere o que falta antes de aplicar (índice único de CNPJ,
-- check de 14 dígitos, trigger de updated_at, políticas de RLS/storage).
--
-- RLS: o app ainda não tem tela de login, então as políticas liberam leitura e
-- escrita para `anon` + `authenticated`. Quando o login for habilitado, troque
-- por políticas que exijam `auth.uid()`.
-- ---------------------------------------------------------------------------

-- Trigger genérica de updated_at --------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tabela ---------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  legal_name text not null,
  cnpj text not null,
  segment text not null,
  email text,
  phone_ddd text,
  phone_number text,
  logo_url text,
  initials text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garante as colunas caso a tabela já existisse em uma versão anterior.
alter table public.clients add column if not exists name text not null default '';
alter table public.clients add column if not exists email text;
alter table public.clients add column if not exists phone_ddd text;
alter table public.clients add column if not exists phone_number text;
alter table public.clients add column if not exists logo_url text;
alter table public.clients add column if not exists initials text not null default '';
alter table public.clients add column if not exists created_at timestamptz not null default now();
alter table public.clients add column if not exists updated_at timestamptz not null default now();

comment on table public.clients is 'Clientes atendidos pela consultoria tributária.';

-- Dados de demonstração: normaliza os CNPJs antigos (com dígitos verificadores
-- inválidos) e os telefones com pontuação, para ficarem iguais ao que o modal
-- grava. Só toca nas 5 empresas de exemplo.
update public.clients as c
   set cnpj = fix.cnpj_valido,
       phone_number = fix.telefone,
       updated_at = now()
  from (values
    ('12345678000190', '12.345.678/0001-95', '33441200'),
    ('98765432000111', '98.765.432/0001-98', '32218890'),
    ('45221908000132', '45.221.908/0001-63', '35554020'),
    ('31556774000105', '31.556.774/0001-27', '30705510'),
    ('22114556000177', '22.114.556/0001-41', '30257744')
  ) as fix(cnpj_antigo, cnpj_valido, telefone)
 where regexp_replace(c.cnpj, '\D', '', 'g') = fix.cnpj_antigo;

-- CNPJ único ignorando pontuação (12.345.678/0001-95 == 12345678000195).
create unique index if not exists clients_cnpj_digits_key
  on public.clients ((regexp_replace(cnpj, '\D', '', 'g')));

create index if not exists clients_legal_name_idx on public.clients (lower(legal_name));

-- Check dos 14 dígitos (não existe no PG o "add constraint if not exists").
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.clients'::regclass
       and conname = 'clients_cnpj_digits_check'
  ) then
    alter table public.clients
      add constraint clients_cnpj_digits_check
      check (char_length(regexp_replace(cnpj, '\D', '', 'g')) = 14);
  end if;
end;
$$;

-- Trigger de updated_at ------------------------------------------------------
drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

-- RLS da tabela --------------------------------------------------------------
alter table public.clients enable row level security;

drop policy if exists "clients_read" on public.clients;
create policy "clients_read"
  on public.clients for select to anon, authenticated using (true);

drop policy if exists "clients_insert" on public.clients;
create policy "clients_insert"
  on public.clients for insert to anon, authenticated with check (true);

drop policy if exists "clients_update" on public.clients;
create policy "clients_update"
  on public.clients for update to anon, authenticated using (true) with check (true);

drop policy if exists "clients_delete" on public.clients;
create policy "clients_delete"
  on public.clients for delete to anon, authenticated using (true);

-- Bucket das logos -----------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-logos',
  'client-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Políticas do bucket. Ficam em um bloco com handler porque o schema
-- `storage` pode não ser gravável em todos os ambientes — nesse caso a
-- migration continua e o aviso aparece no log.
do $$
begin
  execute 'drop policy if exists "client_logos_read" on storage.objects';
  execute 'create policy "client_logos_read" on storage.objects for select to anon, authenticated using (bucket_id = ''client-logos'')';

  execute 'drop policy if exists "client_logos_insert" on storage.objects';
  execute 'create policy "client_logos_insert" on storage.objects for insert to anon, authenticated with check (bucket_id = ''client-logos'')';

  execute 'drop policy if exists "client_logos_update" on storage.objects';
  execute 'create policy "client_logos_update" on storage.objects for update to anon, authenticated using (bucket_id = ''client-logos'') with check (bucket_id = ''client-logos'')';

  execute 'drop policy if exists "client_logos_delete" on storage.objects';
  execute 'create policy "client_logos_delete" on storage.objects for delete to anon, authenticated using (bucket_id = ''client-logos'')';
exception
  when insufficient_privilege then
    raise warning 'Sem permissão para criar as políticas de storage do bucket client-logos: %', sqlerrm;
end;
$$;

-- Carga inicial: os 5 clientes de demonstração (só quando a tabela está vazia).
insert into public.clients (name, legal_name, cnpj, segment, email, phone_ddd, phone_number, initials)
select seed.name, seed.legal_name, seed.cnpj, seed.segment, seed.email,
       seed.phone_ddd, seed.phone_number, seed.initials
  from (values
    ('Alpha Indústria', 'Alpha Indústria de Componentes S.A.', '12.345.678/0001-95', 'Indústria', 'contato@alphaindustria.com.br', '11', '33441200', 'AI'),
    ('Norte Distribuidora', 'Norte Comércio e Distribuição Ltda.', '98.765.432/0001-98', 'Atacado', 'financeiro@nortedistribuidora.com.br', '81', '32218890', 'ND'),
    ('Construtora Vértice', 'Vértice Engenharia e Construções Ltda.', '45.221.908/0001-63', 'Construção civil', 'contato@verticeengenharia.com.br', '31', '35554020', 'CV'),
    ('Grupo Meridiano', 'Meridiano Participações S.A.', '31.556.774/0001-27', 'Holding', 'ri@meridianoparticipacoes.com.br', '11', '30705510', 'GM'),
    ('Clínica Bem Viver', 'Bem Viver Serviços Médicos Ltda.', '22.114.556/0001-41', 'Saúde', 'administrativo@bemviver.com.br', '41', '30257744', 'BV')
  ) as seed(name, legal_name, cnpj, segment, email, phone_ddd, phone_number, initials)
 where not exists (select 1 from public.clients);
