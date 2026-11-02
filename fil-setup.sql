-- À exécuter une fois dans Supabase > SQL Editor

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  body text not null default '' check (char_length(body) <= 1000),
  images text[] not null default '{}' check (array_length(images,1) is null or array_length(images,1) <= 4),
  created_at timestamptz not null default now()
);
create table public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);
alter table public.posts enable row level security;
alter table public.likes enable row level security;

-- Tout le monde lit ; seuls les membres connectés écrivent
create policy "posts lisibles par tous" on public.posts for select using (true);
create policy "posts créés par le membre" on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "posts supprimés par l'auteur" on public.posts for delete to authenticated using (auth.uid() = user_id);
create policy "likes lisibles par tous" on public.likes for select using (true);
create policy "likes créés par le membre" on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "likes supprimés par le membre" on public.likes for delete to authenticated using (auth.uid() = user_id);

-- Stockage des photos (bucket public en lecture)
insert into storage.buckets (id, name, public) values ('feed','feed',true) on conflict do nothing;
create policy "photos lisibles par tous" on storage.objects for select using (bucket_id = 'feed');
create policy "photos envoyées dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'feed' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos supprimées par le propriétaire" on storage.objects for delete to authenticated
  using (bucket_id = 'feed' and (storage.foldername(name))[1] = auth.uid()::text);
