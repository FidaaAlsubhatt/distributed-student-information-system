-- Enable extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- ========== CS Department ==========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'fdw_cs_server') THEN
    CREATE SERVER fdw_cs_server
      FOREIGN DATA WRAPPER postgres_fdw
      OPTIONS (host 'cs_db', port '5432', dbname 'cs_sis');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_user_mappings
    WHERE srvname = 'fdw_cs_server' AND umuser = (SELECT usesysid FROM pg_user WHERE usename = 'admin')
  ) THEN
    CREATE USER MAPPING FOR admin
      SERVER fdw_cs_server
      OPTIONS (user 'fdw_central_reader', password 'fdwpass');
  END IF;
END
$$;

DROP SCHEMA IF EXISTS fdw_cs CASCADE;
CREATE SCHEMA fdw_cs;

IMPORT FOREIGN SCHEMA cs_schema
  FROM SERVER fdw_cs_server
  INTO fdw_cs;

-- ========== Math Department ==========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'fdw_math_server') THEN
    CREATE SERVER fdw_math_server
      FOREIGN DATA WRAPPER postgres_fdw
      OPTIONS (host 'math_db', port '5432', dbname 'math_sis');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_user_mappings
    WHERE srvname = 'fdw_math_server' AND umuser = (SELECT usesysid FROM pg_user WHERE usename = 'admin')
  ) THEN
    CREATE USER MAPPING FOR admin
      SERVER fdw_math_server
      OPTIONS (user 'fdw_central_reader', password 'fdwpass');
  END IF;
END
$$;

DROP SCHEMA IF EXISTS fdw_math CASCADE;
CREATE SCHEMA fdw_math;

IMPORT FOREIGN SCHEMA math_schema
  FROM SERVER fdw_math_server
  INTO fdw_math;
