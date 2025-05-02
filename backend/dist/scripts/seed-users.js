"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
async function seedUsers() {
    // Create a connection to the global database
    const pool = new pg_1.Pool({
        host: process.env.GLOBAL_DB_HOST || 'localhost',
        port: parseInt(process.env.GLOBAL_DB_PORT || '5435'),
        database: process.env.GLOBAL_DB_NAME || 'global_sis',
        user: process.env.GLOBAL_DB_USER || 'admin',
        password: process.env.GLOBAL_DB_PASSWORD || 'adminpass',
    });
    try {
        console.log('🌱 Seeding users and roles...');
        // Read the SQL file
        const sqlFilePath = path_1.default.resolve(__dirname, 'seed-users.sql');
        const sql = fs_1.default.readFileSync(sqlFilePath, 'utf8');
        // Execute the SQL
        await pool.query(sql);
        console.log('✅ Seed completed successfully!');
    }
    catch (error) {
        console.error('❌ Error seeding users:', error);
    }
    finally {
        await pool.end();
    }
}
// Run the seed function
seedUsers();
