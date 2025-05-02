"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbCoordinator = exports.DatabaseCoordinator = void 0;
const pg_1 = require("pg");
class DatabaseCoordinator {
    constructor() {
        this.departmentPools = new Map();
        this.connectToCentralDb();
        this.connectToDepartmentDb('CS');
        this.connectToDepartmentDb('MATH');
    }
    getEnvConfig(prefix) {
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
    connectToCentralDb() {
        const cfg = this.getEnvConfig('GLOBAL');
        this.centralPool = new pg_1.Pool(cfg);
        console.log('✅ Connected to CENTRAL database');
    }
    connectToDepartmentDb(code) {
        const cfg = this.getEnvConfig(code);
        const pool = new pg_1.Pool(cfg);
        this.departmentPools.set(code, pool);
        console.log(`✅ Connected to ${code} department database`);
    }
    getCentralPool() {
        return this.centralPool;
    }
    getDepartmentPool(code) {
        const pool = this.departmentPools.get(code);
        if (!pool)
            throw new Error(`❌ No pool found for department: ${code}`);
        return pool;
    }
}
exports.DatabaseCoordinator = DatabaseCoordinator;
// Export ready-to-use coordinator
exports.dbCoordinator = new DatabaseCoordinator();
