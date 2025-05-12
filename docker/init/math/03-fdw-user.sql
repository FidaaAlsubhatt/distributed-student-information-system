DO $$
BEGIN
  -- Create user if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fdw_central_reader'
  ) THEN
    CREATE USER fdw_central_reader WITH PASSWORD 'fdwpass';
  END IF;
END
$$;

-- GRANT database-level access
GRANT CONNECT ON DATABASE math_sis TO fdw_central_reader;

-- GRANT schema-level access
GRANT USAGE ON SCHEMA math_schema TO fdw_central_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA math_schema TO fdw_central_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA math_schema GRANT SELECT ON TABLES TO fdw_central_reader;
