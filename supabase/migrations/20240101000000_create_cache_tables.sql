-- Drop existing tables if they exist
DROP TABLE IF EXISTS name_cache CASCADE;
DROP TABLE IF EXISTS address_cache CASCADE;

-- Create name_cache table
CREATE TABLE name_cache (
    name TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT name_format CHECK (name ~ '^[a-z0-9-]+\.voi$'),
    CONSTRAINT address_format CHECK (address ~ '^[A-Z2-7]{58}$')
);

-- Create index on address for name_cache (non-unique)
CREATE INDEX name_cache_address_idx ON name_cache(address);

-- Create address_cache table
CREATE TABLE address_cache (
    address TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT address_format CHECK (address ~ '^[A-Z2-7]{58}$'),
    CONSTRAINT name_format CHECK (name ~ '^[a-z0-9-]+\.voi$')
);

-- Create index on name for address_cache (non-unique)
CREATE INDEX address_cache_name_idx ON address_cache(name);

-- Add RLS policies
ALTER TABLE name_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on name_cache" ON name_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on address_cache" ON address_cache
    FOR SELECT USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to insert/update name_cache" ON name_cache
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to insert/update address_cache" ON address_cache
    FOR ALL USING (auth.role() = 'service_role'); 