-- =============================================================================
-- Aguard.ai — 02. Funções de auditoria e soft delete
-- =============================================================================

-- Preenche created_at/by, updated_at/by e deleted_by em qualquer tabela auditada
create or replace function public.fn_auditoria()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_at := new.created_at;
    new.updated_by := new.created_by;
    if new.deleted_at is not null and new.deleted_by is null then
      new.deleted_by := auth.uid();
    end if;
  elsif tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := coalesce(auth.uid(), old.updated_by);

    if new.deleted_at is distinct from old.deleted_at then
      if new.deleted_at is null then
        new.deleted_by := null;
      else
        new.deleted_by := coalesce(auth.uid(), new.deleted_by);
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- Converte DELETE físico em soft delete (marca deleted_at e cancela a exclusão)
create or replace function public.fn_soft_delete()
returns trigger
language plpgsql
as $$
begin
  if old.deleted_at is not null then
    return null;
  end if;

  execute format(
    'update %I.%I set deleted_at = now(), deleted_by = $1 where id = $2',
    tg_table_schema, tg_table_name
  ) using auth.uid(), old.id;

  return null;
end;
$$;

-- Registra o vínculo entre o usuário autenticado e a clínica que ele criou
create or replace function public.fn_vincular_admin_clinica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  insert into public.perfil (id, clinica_id, papel, nome, email)
  values (
    auth.uid(),
    new.id,
    'clinica',
    coalesce((select raw_user_meta_data ->> 'nome' from auth.users where id = auth.uid()), new.nome),
    (select email from auth.users where id = auth.uid())
  )
  on conflict (id) do update
    set clinica_id = excluded.clinica_id,
        papel      = 'clinica',
        updated_at = now();

  return new;
end;
$$;

-- Cria o perfil do profissional assim que ele recebe uma conta de login
create or replace function public.fn_vincular_perfil_profissional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  insert into public.perfil (id, clinica_id, papel, nome, email)
  values (new.user_id, new.clinica_id, 'profissional', new.nome, new.email)
  on conflict (id) do update
    set clinica_id = excluded.clinica_id,
        papel      = 'profissional',
        nome       = excluded.nome,
        updated_at = now();

  return new;
end;
$$;

-- Cria um perfil vazio para todo usuário recém-cadastrado no Supabase Auth
create or replace function public.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfil (id, papel, nome, email)
  values (
    new.id,
    'clinica',
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
