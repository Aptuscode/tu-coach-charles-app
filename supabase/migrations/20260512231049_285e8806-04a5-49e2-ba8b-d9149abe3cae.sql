
-- ENUMS
create type public.app_role as enum ('client','coach');
create type public.announcement_kind as enum ('announcement','motivation','discipline');
create type public.subscription_status as enum ('active','inactive','expired','trial');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- PROFILES policies
create policy "users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "coach view all profiles" on public.profiles for select using (public.has_role(auth.uid(),'coach'));
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "coach update profiles" on public.profiles for update using (public.has_role(auth.uid(),'coach'));
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- USER_ROLES policies
create policy "users view own role" on public.user_roles for select using (auth.uid() = user_id);
create policy "coach view all roles" on public.user_roles for select using (public.has_role(auth.uid(),'coach'));
create policy "coach manage roles" on public.user_roles for all using (public.has_role(auth.uid(),'coach')) with check (public.has_role(auth.uid(),'coach'));

-- HANDLE NEW USER
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'client');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ANNOUNCEMENTS
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  kind public.announcement_kind not null default 'announcement',
  image_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
create policy "anyone authed view announcements" on public.announcements for select to authenticated using (true);
create policy "coach manage announcements" on public.announcements for all using (public.has_role(auth.uid(),'coach')) with check (public.has_role(auth.uid(),'coach'));

-- ROUTINES
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  is_free boolean not null default false,
  is_challenge boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.routines enable row level security;

create table public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),
  title text
);
alter table public.routine_days enable row level security;

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days(id) on delete cascade,
  name text not null,
  sets int,
  reps text,
  rest_seconds int,
  video_url text,
  file_url text,
  notes text,
  position int not null default 0
);
alter table public.exercises enable row level security;

create table public.routine_assignments (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  unique(routine_id, client_id)
);
alter table public.routine_assignments enable row level security;

-- routine policies: free routines visible to all authed; assigned routines visible to client; coach sees all
create policy "view free or challenge routines" on public.routines for select to authenticated using (is_free = true or is_challenge = true);
create policy "client view assigned routines" on public.routines for select using (
  exists (select 1 from public.routine_assignments ra where ra.routine_id = id and ra.client_id = auth.uid())
);
create policy "coach manage routines" on public.routines for all using (public.has_role(auth.uid(),'coach')) with check (public.has_role(auth.uid(),'coach'));

create policy "view routine_days for visible routines" on public.routine_days for select using (
  exists(select 1 from public.routines r where r.id = routine_id and (
    r.is_free or r.is_challenge or
    exists(select 1 from public.routine_assignments ra where ra.routine_id = r.id and ra.client_id = auth.uid())
  )) or public.has_role(auth.uid(),'coach')
);
create policy "coach manage routine_days" on public.routine_days for all using (public.has_role(auth.uid(),'coach')) with check (public.has_role(auth.uid(),'coach'));

create policy "view exercises for visible routines" on public.exercises for select using (
  exists(select 1 from public.routine_days rd join public.routines r on r.id = rd.routine_id where rd.id = routine_day_id and (
    r.is_free or r.is_challenge or
    exists(select 1 from public.routine_assignments ra where ra.routine_id = r.id and ra.client_id = auth.uid())
  )) or public.has_role(auth.uid(),'coach')
);
create policy "coach manage exercises" on public.exercises for all using (public.has_role(auth.uid(),'coach')) with check (public.has_role(auth.uid(),'coach'));

create policy "client view own assignments" on public.routine_assignments for select using (auth.uid() = client_id or public.has_role(auth.uid(),'coach'));
create policy "coach manage assignments" on public.routine_assignments for all using (public.has_role(auth.uid(),'coach')) with check (public.has_role(auth.uid(),'coach'));

-- NUTRITION PROFILES
create table public.nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references auth.users(id) on delete cascade,
  birth_date date,
  gender text,
  occupation text,
  goals text,
  medical_history text,
  family_history text,
  allergies text,
  height_cm numeric,
  weight_kg numeric,
  bmi numeric generated always as (
    case when height_cm is not null and height_cm > 0 and weight_kg is not null
      then round((weight_kg / ((height_cm/100.0) * (height_cm/100.0)))::numeric, 2)
    end
  ) stored,
  updated_at timestamptz not null default now()
);
alter table public.nutrition_profiles enable row level security;
create policy "client manage own nutrition" on public.nutrition_profiles for all using (auth.uid() = client_id) with check (auth.uid() = client_id);
create policy "coach view all nutrition" on public.nutrition_profiles for select using (public.has_role(auth.uid(),'coach'));
create policy "coach update nutrition" on public.nutrition_profiles for update using (public.has_role(auth.uid(),'coach'));

-- DIET PLANS
create table public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  title text not null,
  pdf_path text not null,
  created_at timestamptz not null default now()
);
alter table public.diet_plans enable row level security;
create policy "client view own diets" on public.diet_plans for select using (auth.uid() = client_id);
create policy "coach manage diets" on public.diet_plans for all using (public.has_role(auth.uid(),'coach')) with check (public.has_role(auth.uid(),'coach'));

-- PROGRESS PHOTOS
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  note text,
  taken_at timestamptz not null default now()
);
alter table public.progress_photos enable row level security;
create policy "client manage own photos" on public.progress_photos for all using (auth.uid() = client_id) with check (auth.uid() = client_id);
create policy "coach view all photos" on public.progress_photos for select using (public.has_role(auth.uid(),'coach'));

-- LAB RESULTS
create table public.lab_results (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.lab_results enable row level security;
create policy "client manage own labs" on public.lab_results for all using (auth.uid() = client_id) with check (auth.uid() = client_id);
create policy "coach view all labs" on public.lab_results for select using (public.has_role(auth.uid(),'coach'));

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'Free',
  status public.subscription_status not null default 'inactive',
  started_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "client view own sub" on public.subscriptions for select using (auth.uid() = client_id);
create policy "coach manage subs" on public.subscriptions for all using (public.has_role(auth.uid(),'coach')) with check (public.has_role(auth.uid(),'coach'));

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "view own messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "update own received" on public.messages for update using (auth.uid() = recipient_id);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "coach create notifications" on public.notifications for insert with check (public.has_role(auth.uid(),'coach') or auth.uid() = user_id);

-- REALTIME
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.announcements;

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values
  ('routine-files','routine-files', false),
  ('diet-pdfs','diet-pdfs', false),
  ('progress-photos','progress-photos', false),
  ('lab-results','lab-results', false),
  ('posters','posters', true),
  ('avatars','avatars', true);

-- Storage policies: file paths begin with auth.uid()/...
-- routine-files: coach manages, anyone authed reads
create policy "coach upload routine files" on storage.objects for insert to authenticated with check (bucket_id = 'routine-files' and public.has_role(auth.uid(),'coach'));
create policy "authed read routine files" on storage.objects for select to authenticated using (bucket_id = 'routine-files');
create policy "coach update routine files" on storage.objects for update to authenticated using (bucket_id = 'routine-files' and public.has_role(auth.uid(),'coach'));
create policy "coach delete routine files" on storage.objects for delete to authenticated using (bucket_id = 'routine-files' and public.has_role(auth.uid(),'coach'));

-- diet-pdfs: coach uploads to <clientId>/...; client reads own
create policy "coach manage diet pdfs" on storage.objects for all to authenticated using (bucket_id = 'diet-pdfs' and public.has_role(auth.uid(),'coach')) with check (bucket_id = 'diet-pdfs' and public.has_role(auth.uid(),'coach'));
create policy "client read own diet pdfs" on storage.objects for select to authenticated using (bucket_id = 'diet-pdfs' and (auth.uid()::text = (storage.foldername(name))[1]));

-- progress-photos: client manages own folder, coach reads all
create policy "client manage own progress photos" on storage.objects for all to authenticated using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "coach read progress photos" on storage.objects for select to authenticated using (bucket_id = 'progress-photos' and public.has_role(auth.uid(),'coach'));

-- lab-results: same pattern
create policy "client manage own labs" on storage.objects for all to authenticated using (bucket_id = 'lab-results' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id = 'lab-results' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "coach read labs" on storage.objects for select to authenticated using (bucket_id = 'lab-results' and public.has_role(auth.uid(),'coach'));

-- posters: public read, coach write
create policy "public read posters" on storage.objects for select using (bucket_id = 'posters');
create policy "coach manage posters" on storage.objects for all to authenticated using (bucket_id = 'posters' and public.has_role(auth.uid(),'coach')) with check (bucket_id = 'posters' and public.has_role(auth.uid(),'coach'));

-- avatars: public read, owner write
create policy "public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "user manage own avatar" on storage.objects for all to authenticated using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
