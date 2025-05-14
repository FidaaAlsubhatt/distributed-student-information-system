-- 01-global.sql: Central “public” schema
CREATE SCHEMA IF NOT EXISTS central;
SET search_path = central;
-- 1.1 Core Identity & Profiles
CREATE TABLE IF NOT EXISTS users (
  user_id       SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id      INT          PRIMARY KEY
                 REFERENCES users(user_id) ON DELETE CASCADE,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  phone        VARCHAR(20),
  office       TEXT,
  timezone     TEXT         NOT NULL DEFAULT 'UTC',
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 1.2 Roles & RBAC
CREATE TABLE IF NOT EXISTS roles (
  role_id      SERIAL PRIMARY KEY,
  name         VARCHAR(50) NOT NULL UNIQUE,
  scope        VARCHAR(20) NOT NULL DEFAULT 'department',
  description  TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
  id           SERIAL PRIMARY KEY,
  user_id      INT    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id      INT    NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  assigned_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- 1.3 Departments & Mapping
CREATE TABLE IF NOT EXISTS departments (
  dept_id       SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  host          TEXT         NOT NULL,
  port          INT          NOT NULL DEFAULT 5432,
  dbname        TEXT         NOT NULL,
  schema_prefix VARCHAR(50)  NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',
  contact_email VARCHAR(255),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_department (
  id            SERIAL PRIMARY KEY,
  user_id       INT    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  dept_id       INT    NOT NULL REFERENCES departments(dept_id) ON DELETE CASCADE,
  role_id       INT    NOT NULL REFERENCES roles(role_id),
  assigned_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, dept_id, role_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id       SERIAL PRIMARY KEY,
  user_id      INT     REFERENCES users(user_id),
  dept_id      INT,                    -- NULL for cross‐dept actions
  action_type  VARCHAR(50) NOT NULL,
  table_name   TEXT    NOT NULL,
  record_id    INT,
  details      JSONB,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS user_id_map (
  global_user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_id            INT NOT NULL REFERENCES departments(dept_id) ON DELETE CASCADE,
  local_user_id      INT NOT NULL,
  university_email   VARCHAR(255) NOT NULL,
  role_type          VARCHAR(20), 
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(), 
  UNIQUE(dept_id, local_user_id),
  UNIQUE(dept_id, university_email)
);
