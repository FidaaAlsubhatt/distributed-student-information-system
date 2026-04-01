import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { buildRuntimeConfig } from '../config/env';

function validEnv(): NodeJS.ProcessEnv {
  return {
    PORT: '3001',
    SESSION_SECRET: 'super-secret-value',
    GLOBAL_DB_HOST: 'localhost',
    GLOBAL_DB_PORT: '5435',
    GLOBAL_DB_NAME: 'global_sis',
    GLOBAL_DB_USER: 'admin',
    GLOBAL_DB_PASSWORD: 'adminpass',
    CS_DB_HOST: 'localhost',
    CS_DB_PORT: '5433',
    CS_DB_NAME: 'cs_sis',
    CS_DB_USER: 'cs_admin',
    CS_DB_PASSWORD: 'cspass',
    MATH_DB_HOST: 'localhost',
    MATH_DB_PORT: '5434',
    MATH_DB_NAME: 'math_sis',
    MATH_DB_USER: 'math_admin',
    MATH_DB_PASSWORD: 'mathpass',
  };
}

describe('runtime env config', () => {
  test('builds config from a complete env set', () => {
    const config = buildRuntimeConfig(validEnv());

    assert.equal(config.port, 3001);
    assert.equal(config.sessionSecret, 'super-secret-value');
    assert.equal(config.globalDb.port, 5435);
    assert.equal(config.departmentDbs.cs_schema.user, 'cs_admin');
  });

  test('requires SESSION_SECRET', () => {
    const env = validEnv();
    delete env.SESSION_SECRET;

    assert.throws(
      () => buildRuntimeConfig(env),
      /Missing required environment variable: SESSION_SECRET/
    );
  });

  test('requires database credentials instead of falling back to defaults', () => {
    const env = validEnv();
    delete env.GLOBAL_DB_PASSWORD;

    assert.throws(
      () => buildRuntimeConfig(env),
      /Missing required environment variable: GLOBAL_DB_PASSWORD/
    );
  });

  test('rejects invalid port values', () => {
    const env = validEnv();
    env.CS_DB_PORT = 'not-a-port';

    assert.throws(
      () => buildRuntimeConfig(env),
      /Invalid CS_DB_PORT/
    );
  });
});
