-- Givora World: initial schema
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  artist_name text not null default '',
  price_inr numeric(10,2) not null check (price_inr > 0),
  stock integer not null default 0 check (stock >= 0),
  sold integer not null default 0 check (sold >= 0),
  asset_path text not null,
  asset_type text not null check (asset_type in ('bin','image')),
  viewer_config jsonb not null default '{}'::jsonb,
  palette text[] not null default array['#0dffab','#1456ff','#8dcaff'],
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  buyer_email text not null,
  amount numeric(10,2) not null,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  cashfree_order_id text not null unique,
  cf_payment_id text,
  is_gift boolean not null default false,
  gift_recipient_email text,
  created_at timestamptz not null default now()
);

create table public.editions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  order_id uuid not null unique references public.orders(id),
  edition_no integer not null,
  claim_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  owner_id uuid references auth.users(id),
  claimed_at timestamptz,
  recipient_email text,
  created_at timestamptz not null default now(),
  unique (product_id, edition_no)
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.editions enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid());
create policy "published products are public" on public.products for select using (status = 'published');
create policy "own editions" on public.editions for select using (owner_id = auth.uid());
-- orders: no policies => only the service role can access.

-- Reserve one unit of stock; returns true on success.
create or replace function public.reserve_stock(p_product uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update products set stock = stock - 1 where id = p_product and status = 'published' and stock > 0;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Mark a pending order failed/expired and give the stock back (idempotent).
create or replace function public.release_order(p_cf_order text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  select * into o from orders where cashfree_order_id = p_cf_order for update;
  if not found or o.status <> 'pending' then return; end if;
  update orders set status = p_status where id = o.id;
  update products set stock = stock + 1 where id = o.product_id;
end $$;

-- Expire stale pending orders (called lazily when creating orders).
create or replace function public.expire_stale_orders() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select cashfree_order_id from orders where status = 'pending' and created_at < now() - interval '30 minutes' loop
    perform release_order(r.cashfree_order_id, 'expired');
  end loop;
end $$;

-- Idempotent fulfilment: marks paid and mints the edition. Returns the claim token.
create or replace function public.fulfill_order(p_cf_order text, p_payment_id text) returns text
language plpgsql security definer set search_path = public as $$
declare o orders; n int; tok text;
begin
  select * into o from orders where cashfree_order_id = p_cf_order for update;
  if not found then return null; end if;
  select claim_token into tok from editions where order_id = o.id;
  if tok is not null then return tok; end if;
  -- A late payment on an expired order after stock was released still gets fulfilled if stock remains.
  if o.status = 'expired' or o.status = 'failed' then
    update products set stock = stock - 1 where id = o.product_id and stock > 0;
    get diagnostics n = row_count;
    if n = 0 then return null; end if;
  end if;
  update orders set status = 'paid', cf_payment_id = p_payment_id where id = o.id;
  update products set sold = sold + 1 where id = o.product_id returning sold into n;
  insert into editions (product_id, order_id, edition_no, recipient_email)
  values (o.product_id, o.id, n, o.gift_recipient_email) returning claim_token into tok;
  return tok;
end $$;

-- Atomically claim an edition. Returns the product id, or null if unavailable.
create or replace function public.claim_edition(p_token text, p_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  update editions set owner_id = p_user, claimed_at = now()
  where claim_token = p_token and owner_id is null returning product_id into pid;
  return pid;
end $$;

revoke all on function public.reserve_stock, public.release_order, public.expire_stale_orders,
  public.fulfill_order, public.claim_edition from public, anon, authenticated;

-- Public storage bucket for product assets (writes via service role only).
insert into storage.buckets (id, name, public) values ('product-assets', 'product-assets', true)
on conflict (id) do nothing;

-- Make yourself admin after signing up:
-- update public.profiles set is_admin = true where email = 'you@example.com';

-- Backfill profiles for users created before the trigger existed.
insert into public.profiles (id, email) select id, email from auth.users on conflict (id) do nothing;
