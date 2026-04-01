import dotenv from 'dotenv';
import path from 'path';
import type { PoolConfig } from 'pg';

export interface DbConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface RuntimeConfig {
  port: number;
  sessionSecret: string;
  globalDb: DbConfig;
  departmentDbs: Record<'cs_schema' | 'math_schema', DbConfig>;
}

export const envFilePath = path.resolve(__dirname, '../../.env');

let hasLoadedEnv = false;

export function loadEnv() {
  if (hasLoadedEnv) {
    return;
  }

  dotenv.config({ path: envFilePath });
  hasLoadedEnv = true;
}

function requireEnv(source: NodeJS.ProcessEnv, name: string): string {
  const value = source[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePort(name: string, rawValue: string): number {
  const port = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer, received "${rawValue}"`);
  }

  return port;
}

function buildDbConfig(prefix: 'GLOBAL' | 'CS' | 'MATH', source: NodeJS.ProcessEnv): DbConfig {
  return {
    host: requireEnv(source, `${prefix}_DB_HOST`),
    port: parsePort(`${prefix}_DB_PORT`, requireEnv(source, `${prefix}_DB_PORT`)),
    database: requireEnv(source, `${prefix}_DB_NAME`),
    user: requireEnv(source, `${prefix}_DB_USER`),
    password: requireEnv(source, `${prefix}_DB_PASSWORD`),
  };
}

export function buildRuntimeConfig(source: NodeJS.ProcessEnv): RuntimeConfig {
  const portValue = source.PORT?.trim() || '3001';

  return {
    port: parsePort('PORT', portValue),
    sessionSecret: requireEnv(source, 'SESSION_SECRET'),
    globalDb: buildDbConfig('GLOBAL', source),
    departmentDbs: {
      cs_schema: buildDbConfig('CS', source),
      math_schema: buildDbConfig('MATH', source),
    },
  };
}

loadEnv();

export const env = buildRuntimeConfig(process.env);
