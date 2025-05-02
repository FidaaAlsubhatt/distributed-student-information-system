import { Pool } from 'pg';

interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DatabaseCoordinator {
  centralPool!: Pool;
  departmentPools = new Map<string, Pool>();

  constructor() {
    this.connectToCentralDb();
    this.connectToDepartmentDb('CS');
    this.connectToDepartmentDb('MATH');
  }

  private getEnvConfig(prefix: string): DBConfig {
    const host = process.env[`${prefix}_DB_HOST`];
    const port = parseInt(process.env[`${prefix}_DB_PORT`] || '5432', 10);
    const database = process.env[`${prefix}_DB_NAME`];
    const user = process.env[`${prefix}_DB_USER`];
    const password = process.env[`${prefix}_DB_PASSWORD`];

    // Debug logging
    console.log(`🔍 Loading config for ${prefix}:`);
    console.log({ host, port, database, user, password });

    // Basic validation
    if (!host || !database || !user || !password) {
      throw new Error(`❌ Missing environment variable(s) for ${prefix} DB`);
    }

    return { host, port, database, user, password };
  }

  private connectToCentralDb() {
    const cfg = this.getEnvConfig('GLOBAL');
    this.centralPool = new Pool(cfg);
    console.log('✅ Connected to CENTRAL database');
  }

  private connectToDepartmentDb(code: string) {
    const cfg = this.getEnvConfig(code);
    const pool = new Pool(cfg);
    this.departmentPools.set(code, pool);
    console.log(`✅ Connected to ${code} department database`);
  }

  getCentralPool(): Pool {
    return this.centralPool;
  }

  getDepartmentPool(code: string): Pool {
    const pool = this.departmentPools.get(code);
    if (!pool) throw new Error(`❌ No pool found for department: ${code}`);
    return pool;
  }
}

// Export ready-to-use coordinator
export const dbCoordinator = new DatabaseCoordinator();

