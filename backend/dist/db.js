"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartmentPool = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// Create a connection pool to the global database
exports.pool = new pg_1.Pool({
    host: process.env.GLOBAL_DB_HOST || 'localhost',
    port: parseInt(process.env.GLOBAL_DB_PORT || '5435'),
    database: process.env.GLOBAL_DB_NAME || 'global_sis',
    user: process.env.GLOBAL_DB_USER || 'admin',
    password: process.env.GLOBAL_DB_PASSWORD || 'adminpass',
});
// Create a function to get a department-specific connection pool
const getDepartmentPool = (deptSchemaPrefix) => {
    return new pg_1.Pool({
        host: process.env.DEPT_DB_HOST || 'localhost',
        port: parseInt(process.env.DEPT_DB_PORT || '5436'),
        database: process.env.DEPT_DB_NAME || 'dept_sis',
        user: process.env.DEPT_DB_USER || 'admin',
        password: process.env.DEPT_DB_PASSWORD || 'adminpass',
        // Set the search path to the department schema
        options: `-c search_path=${deptSchemaPrefix},public`
    });
};
exports.getDepartmentPool = getDepartmentPool;
// Test the database connection
exports.pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    }
    else {
        console.log('✅ Database connected at:', res.rows[0].now);
    }
});
