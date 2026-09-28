-- Enable authenticated access for the app and provision its initial account.
-- Supabase Auth stores the password as a bcrypt hash in auth.users.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  app_user_id uuid;
begin
  select id into app_user_id
    from auth.users
   where lower(email) = 'timaracas@orcoma.com.br'
   limit 1;

  if app_user_id is null then
    app_user_id := gen_random_uuid();
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    ) values (
      app_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'timaracas@orcoma.com.br',
      extensions.crypt('Orcoma@2026', extensions.gen_salt('bf', 12)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Timaracas","email_verified":true}'::jsonb,
      now(),
      now(),
      false,
      false
    );
  end if;

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  ) values (
    app_user_id::text,
    app_user_id,
    jsonb_build_object('sub', app_user_id::text, 'email', 'timaracas@orcoma.com.br', 'email_verified', true),
    'email',
    now(),
    now()
  ) on conflict (provider_id, provider) do nothing;
end;
$$;

-- The original client migration allowed anonymous access before login existed.
-- Replace those policies now that every application route requires a session.
alter table public.clients enable row level security;

drop policy if exists "clients_read" on public.clients;
create policy "clients_read"
  on public.clients for select to authenticated
  using (auth.uid() is not null);

drop policy if exists "clients_insert" on public.clients;
create policy "clients_insert"
  on public.clients for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists "clients_update" on public.clients;
create policy "clients_update"
  on public.clients for update to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "clients_delete" on public.clients;
create policy "clients_delete"
  on public.clients for delete to authenticated
  using (auth.uid() is not null);

drop policy if exists "client_logos_read" on storage.objects;
create policy "client_logos_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'client-logos' and auth.uid() is not null);

drop policy if exists "client_logos_insert" on storage.objects;
create policy "client_logos_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'client-logos' and auth.uid() is not null);

drop policy if exists "client_logos_update" on storage.objects;
create policy "client_logos_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'client-logos' and auth.uid() is not null)
  with check (bucket_id = 'client-logos' and auth.uid() is not null);

drop policy if exists "client_logos_delete" on storage.objects;
create policy "client_logos_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'client-logos' and auth.uid() is not null);
