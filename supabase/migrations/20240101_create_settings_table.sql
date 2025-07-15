-- Create settings table if it doesn't exist
create or replace function create_settings_table() returns void as $$
begin
  -- Check if table exists
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'settings_qwerty12345') then
    -- Create settings table
    create table public.settings_qwerty12345 (
      id integer primary key,
      whatsapp_number text,
      company_name text,
      company_email text,
      company_address text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Add RLS policies
    alter table public.settings_qwerty12345 enable row level security;

    -- Allow read access to all authenticated users
    create policy "Allow read access to all users" on public.settings_qwerty12345
      for select using (true);

    -- Allow update access to admin users only
    create policy "Allow update access to admins" on public.settings_qwerty12345
      for update using (
        auth.role() in ('admin', 'main_admin')
      ) with check (
        auth.role() in ('admin', 'main_admin')
      );

    -- Allow insert access to admin users only
    create policy "Allow insert access to admins" on public.settings_qwerty12345
      for insert with check (
        auth.role() in ('admin', 'main_admin')
      );
  end if;
end;
$$ language plpgsql;