-- Utvid profiles med default_mode og current_mode
alter table profiles
add column if not exists default_mode text check (default_mode in ('maker', 'goer')) default 'maker',
add column if not exists current_mode text check (current_mode in ('maker', 'goer')) default 'maker';

-- Lag tabell for events_market
create table if not exists events_market (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  portfolio_id uuid references profile_portfolio(id) on delete set null,
  ticket_price numeric,
  venue text,
  date date not null,
  time time,
  created_by uuid references profiles(user_id) on delete cascade,
  is_public boolean default false,
  created_at timestamptz default now()
);