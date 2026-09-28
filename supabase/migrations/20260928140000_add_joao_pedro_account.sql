-- Provision the additional platform account in Supabase Auth.
-- Passwords are stored as bcrypt hashes by Supabase Auth.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  app_user_id uuid;
begin
  select id into app_user_id
    from auth.users
   where lower(email) = 'joao.pedro@orcoma.com.br'
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
      'joao.pedro@orcoma.com.br',
      extensions.crypt('Mascarenhas1987/', extensions.gen_salt('bf', 12)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"João Pedro","email_verified":true}'::jsonb,
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
    jsonb_build_object('sub', app_user_id::text, 'email', 'joao.pedro@orcoma.com.br', 'email_verified', true),
    'email',
    now(),
    now()
  ) on conflict (provider_id, provider) do nothing;
end;
$$;
