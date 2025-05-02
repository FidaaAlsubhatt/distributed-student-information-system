"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
const coordinator_1 = require("../db/coordinator");
async function getAllUsers() {
    const pool = coordinator_1.dbCoordinator.getCentralPool();
    const result = await pool.query(`
    SELECT u.id, u.username, u.email, u.role, u.full_name, d.name AS department
    FROM global_users u
    LEFT JOIN global_departments d ON u.department_id = d.id
  `);
    return result.rows;
}
