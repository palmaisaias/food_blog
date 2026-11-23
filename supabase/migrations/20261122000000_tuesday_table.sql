create table public.administrators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.administrators enable row level security;
revoke all on public.administrators from anon, authenticated;

create function public.is_table_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.administrators where user_id = (select auth.uid()));
$$;
revoke all on function public.is_table_admin() from public;
grant execute on function public.is_table_admin() to anon, authenticated;

create table public.participants (
  id text primary key check (id ~ '^[a-z][a-z0-9-]*$'),
  name text not null,
  position smallint not null unique check (position > 0)
);
insert into public.participants (id, name, position) values
  ('owner', 'Isaías', 1), ('daniel', 'Daniel', 2), ('jacky', 'Jacky', 3);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  issue integer generated always as identity unique,
  slug text not null unique check (char_length(slug) <= 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 140),
  intro text not null default '' check (char_length(intro) <= 2500),
  category text not null check (category in ('Dinner','Lunch','Breakfast','Sides','Baking','Dessert')),
  difficulty text not null check (difficulty in ('Easy','Intermediate','Project')),
  prep integer not null check (prep between 0 and 10080),
  cook integer not null check (cook between 0 and 10080),
  servings integer not null check (servings between 1 and 48),
  notes text not null default '' check (char_length(notes) <= 4000),
  substitutions text not null default '' check (char_length(substitutions) <= 4000),
  status text not null default 'draft' check (status in ('draft','scheduled','published')),
  published_at timestamptz,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  check ((status = 'draft') = (published_at is null))
);

create index recipes_publication_idx on public.recipes (published_at desc, issue desc)
  where status in ('published', 'scheduled');

create table public.recipe_ingredients (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position integer not null check (position > 0),
  amount numeric check (amount between 0 and 100000),
  unit text not null check (char_length(unit) <= 40),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  note text not null check (char_length(note) <= 200),
  primary key (recipe_id, position)
);

create table public.recipe_instructions (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (char_length(title) <= 140),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  primary key (recipe_id, position)
);

create table public.recipe_images (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  -- Position zero is the cover; a positive position belongs to the matching step.
  position integer not null check (position >= 0),
  object_path text not null check (object_path ~ ('^' || recipe_id::text || '/[0-9a-f-]{36}\.webp$')),
  alt text not null check (char_length(alt) <= 240),
  caption text not null check (char_length(caption) <= 300),
  primary key (recipe_id, position)
);
create index recipe_images_path_idx on public.recipe_images (object_path);

create table public.participant_submissions (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  participant_id text not null references public.participants(id),
  comment text not null default '' check (char_length(comment) <= 4000),
  cooked_on date,
  primary key (recipe_id, participant_id)
);

create table public.submission_photographs (
  recipe_id uuid not null,
  participant_id text not null,
  position integer not null check (position > 0),
  object_path text not null check (object_path ~ ('^' || recipe_id::text || '/[0-9a-f-]{36}\.webp$')),
  alt text not null check (char_length(alt) <= 240),
  caption text not null check (char_length(caption) <= 300),
  primary key (recipe_id, participant_id, position),
  foreign key (recipe_id, participant_id) references public.participant_submissions on delete cascade
);
create index submission_photographs_path_idx on public.submission_photographs (object_path);

alter table public.participants enable row level security;
revoke all on public.participants from anon, authenticated;
grant select on public.participants to anon, authenticated;
create policy participants_read on public.participants for select to anon, authenticated using (true);

alter table public.recipes enable row level security;
revoke all on public.recipes from anon, authenticated;
grant select on public.recipes to anon, authenticated;
grant insert, update, delete on public.recipes to authenticated;
grant usage, select on sequence public.recipes_issue_seq to authenticated;
create policy public_recipes on public.recipes for select to anon, authenticated
  using (status in ('published', 'scheduled') and published_at <= now());
create policy admin_recipes on public.recipes for all to authenticated
  using ((select public.is_table_admin())) with check ((select public.is_table_admin()));

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'recipe_ingredients', 'recipe_instructions', 'recipe_images', 'participant_submissions', 'submission_photographs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to anon, authenticated', table_name);
    execute format('grant insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy public_read on public.%I for select to anon, authenticated using
      (exists (select 1 from public.recipes r where r.id = recipe_id
      and r.status in (''published'', ''scheduled'') and r.published_at <= now()))', table_name);
    execute format('create policy admin_write on public.%I for all to authenticated using
      ((select public.is_table_admin())) with check ((select public.is_table_admin()))', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', false, 4194304, array['image/webp']);

-- An anonymous request can download a file only while a published recipe references it.
create policy published_photo_reads on storage.objects for select to anon, authenticated using (
  bucket_id = 'recipe-photos' and (
    exists (select 1 from public.recipe_images p where p.object_path = objects.name)
    or exists (select 1 from public.submission_photographs p where p.object_path = objects.name)
  )
);
create policy table_admin_photo_access on storage.objects for all to authenticated
  using (bucket_id = 'recipe-photos' and (select public.is_table_admin()))
  with check (bucket_id = 'recipe-photos' and (select public.is_table_admin())
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$');

create function public.save_table_recipe(recipe_id uuid, expected_version integer, payload jsonb)
returns public.recipes language plpgsql security invoker set search_path = ''
as $$
declare
  existing public.recipes;
  saved public.recipes;
  new_status text := payload->>'status';
  new_date timestamptz;
  publish_day date;
  cover jsonb := payload->'cover';
begin
  if not public.is_table_admin() then
    raise exception using errcode = '42501', message = 'Administrator access required.';
  end if;

  select * into existing from public.recipes r where r.id = recipe_id for update;
  if (existing.id is null and expected_version <> 0)
    or (existing.id is not null and existing.version is distinct from expected_version) then
    raise exception using errcode = '40001', message = 'This recipe changed. Reload before saving again.';
  end if;

  if new_status = 'published' then
    if jsonb_typeof(cover) is distinct from 'object' or btrim(cover->>'alt') = ''
      or btrim(payload->>'intro') = ''
      or jsonb_array_length(payload->'ingredients') = 0 or jsonb_array_length(payload->'steps') = 0 then
      raise exception using errcode = '22023', message = 'Add the introduction, cover, ingredients and steps before publishing.';
    end if;
    new_date := case when existing.published_at <= now() then existing.published_at else now() end;
  elsif new_status = 'scheduled' then
    if jsonb_typeof(cover) is distinct from 'object' or btrim(cover->>'alt') = ''
      or btrim(payload->>'intro') = ''
      or jsonb_array_length(payload->'ingredients') = 0 or jsonb_array_length(payload->'steps') = 0 then
      raise exception using errcode = '22023', message = 'Add the introduction, cover, ingredients and steps before scheduling.';
    end if;
    publish_day := (payload->>'scheduleDate')::date;
    new_date := publish_day::timestamp at time zone 'America/Los_Angeles';
    if new_date is null or extract(isodow from publish_day) <> 2 or new_date <= now() then
      raise exception using errcode = '22023', message = 'Choose a future Tuesday in Pacific time.';
    end if;
  end if;

  if existing.id is null then
    insert into public.recipes (id, slug, title, intro, category, difficulty, prep, cook, servings, notes, substitutions, status, published_at)
    values (recipe_id, payload->>'slug', payload->>'title', payload->>'intro', payload->>'category', payload->>'difficulty',
      (payload->>'prep')::int, (payload->>'cook')::int, (payload->>'servings')::int, payload->>'notes', payload->>'substitutions',
      new_status, new_date)
    returning * into saved;
  else
    update public.recipes r set slug = payload->>'slug', title = payload->>'title', intro = payload->>'intro',
      category = payload->>'category', difficulty = payload->>'difficulty', prep = (payload->>'prep')::int,
      cook = (payload->>'cook')::int, servings = (payload->>'servings')::int, notes = payload->>'notes',
      substitutions = payload->>'substitutions', status = new_status, published_at = new_date,
      version = existing.version + 1, updated_at = now()
    where r.id = recipe_id returning * into saved;
  end if;

  delete from public.recipe_ingredients i where i.recipe_id = saved.id;
  delete from public.recipe_instructions i where i.recipe_id = saved.id;
  delete from public.recipe_images i where i.recipe_id = saved.id;
  delete from public.participant_submissions s where s.recipe_id = saved.id;

  insert into public.recipe_ingredients
    select saved.id, i.position, (i.item->>'amount')::numeric, i.item->>'unit', i.item->>'name', i.item->>'note'
    from jsonb_array_elements(payload->'ingredients') with ordinality as i(item, position);
  insert into public.recipe_instructions
    select saved.id, s.position, s.item->>'title', s.item->>'body'
    from jsonb_array_elements(payload->'steps') with ordinality as s(item, position);
  insert into public.recipe_images
    select saved.id, 0, cover->>'path', cover->>'alt', cover->>'caption' where jsonb_typeof(cover) = 'object'
    union all
    select saved.id, s.position, s.item->'photo'->>'path', s.item->'photo'->>'alt', s.item->'photo'->>'caption'
    from jsonb_array_elements(payload->'steps') with ordinality as s(item, position)
    where jsonb_typeof(s.item->'photo') = 'object';
  insert into public.participant_submissions
    select saved.id, s.item->>'kitchen', s.item->>'comment', (s.item->>'cookedOn')::date
    from jsonb_array_elements(payload->'submissions') as s(item);
  insert into public.submission_photographs
    select saved.id, s.item->>'kitchen', p.position, p.item->>'path', p.item->>'alt', p.item->>'caption'
    from jsonb_array_elements(payload->'submissions') as s(item)
    cross join lateral jsonb_array_elements(s.item->'photos') with ordinality as p(item, position);

  if exists (
    select 1
    from (
      select p.object_path from public.recipe_images p where p.recipe_id = saved.id
      union
      select p.object_path from public.submission_photographs p where p.recipe_id = saved.id
    ) as paths
    where not exists (
      select 1 from storage.objects o where o.bucket_id = 'recipe-photos' and o.name = paths.object_path
    )
  ) then
    raise exception using errcode = '22023', message = 'A photo is missing. Upload it again before saving.';
  end if;

  return saved;
end $$;
revoke all on function public.save_table_recipe(uuid, integer, jsonb) from public, anon;
grant execute on function public.save_table_recipe(uuid, integer, jsonb) to authenticated;
