-- Create a table for system-wide configuration and tax parameters
create table if not exists system_parameters (
    key text not null,
    year integer not null,
    value jsonb not null,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    primary key (key, year)
);

-- Enable RLS
alter table system_parameters enable row level security;

-- Allow read access to authenticated users
create policy "Authenticated users can read system parameters"
    on system_parameters for select
    to authenticated
    using (true);

-- Only service role can modify (admin function)
create policy "Service role can modify system parameters"
    on system_parameters for all
    to service_role
    using (true);

-- Insert Income Base Amount (Inkomstbasbelopp - IBB)
insert into system_parameters (key, year, value, description) values
('ibb', 2023, '52500', 'Inkomstbasbelopp för 2023'),
('ibb', 2024, '57300', 'Inkomstbasbelopp för 2024'),
('ibb', 2025, '58500', 'Prognostiserat Inkomstbasbelopp för 2025'),
('k10_schablon_rate', 2024, '2.75', 'Multiplikator för Förenklingsregeln (2.75 * IBB)'),
('k10_schablon_rate', 2025, '2.75', 'Multiplikator för Förenklingsregeln (2.75 * IBB)');
