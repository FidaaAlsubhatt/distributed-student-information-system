-- Seed data for the new database schema

-- 1. Seed roles first
INSERT INTO central.roles (name, scope, description) VALUES
('student', 'department', 'Regular student role'),
('academic_staff', 'department', 'Academic staff member'),
('department_admin', 'department', 'Department administrator'),
('central_admin', 'central', 'Central system administrator')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed departments
INSERT INTO central.departments (name, host, port, dbname, schema_prefix, status, contact_email) VALUES
('Computer Science', 'localhost', 5433, 'cs_sis', 'cs_schema', 'active', 'cs@university.ac.uk'),
('Mathematics', 'localhost', 5434, 'math_sis', 'math_schema', 'active', 'math@university.ac.uk')
ON CONFLICT (name) DO NOTHING;

-- 3. Seed users with bcrypt hashed passwords (all passwords are 'password123')
INSERT INTO central.users (email, password_hash, status, created_at) VALUES
-- Student users
('student@university.ac.uk', '$2b$10$JBVz7YBBbSlgvj3HAYQIaO9mz637Af2RfQKgV3gtSK/FkdnL/9tzi', 'active', NOW()),
-- Academic staff users
('academic@university.ac.uk', '$2b$10$JBVz7YBBbSlgvj3HAYQIaO9mz637Af2RfQKgV3gtSK/FkdnL/9tzi', 'active', NOW()),
-- Department admin users
('department@university.ac.uk', '$2b$10$JBVz7YBBbSlgvj3HAYQIaO9mz637Af2RfQKgV3gtSK/FkdnL/9tzi', 'active', NOW()),
-- Central admin users
('admin@university.ac.uk', '$2b$10$JBVz7YBBbSlgvj3HAYQIaO9mz637Af2RfQKgV3gtSK/FkdnL/9tzi', 'active', NOW())
ON CONFLICT (email) DO NOTHING;

-- 4. Seed user profiles
INSERT INTO central.user_profiles (user_id, first_name, last_name, phone, office, timezone) VALUES
((SELECT user_id FROM central.users WHERE email = 'student@university.ac.uk'), 'John', 'Student', '+447700900000', NULL, 'Europe/London'),
((SELECT user_id FROM central.users WHERE email = 'academic@university.ac.uk'), 'Jane', 'Academic', '+447700900001', 'CS-101', 'Europe/London'),
((SELECT user_id FROM central.users WHERE email = 'department@university.ac.uk'), 'David', 'Department', '+447700900002', 'CS-201', 'Europe/London'),
((SELECT user_id FROM central.users WHERE email = 'admin@university.ac.uk'), 'Sarah', 'Admin', '+447700900003', 'ADMIN-101', 'Europe/London')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Assign global roles to users
INSERT INTO central.user_roles (user_id, role_id, assigned_at) VALUES
((SELECT user_id FROM central.users WHERE email = 'admin@university.ac.uk'), (SELECT role_id FROM central.roles WHERE name = 'central_admin'), NOW()),
((SELECT user_id FROM central.users WHERE email = 'student@university.ac.uk'), (SELECT role_id FROM central.roles WHERE name = 'student'), NOW()),
((SELECT user_id FROM central.users WHERE email = 'academic@university.ac.uk'), (SELECT role_id FROM central.roles WHERE name = 'academic_staff'), NOW()),
((SELECT user_id FROM central.users WHERE email = 'department@university.ac.uk'), (SELECT role_id FROM central.roles WHERE name = 'department_admin'), NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 6. Assign department-specific roles and map users to departments
INSERT INTO central.user_department (user_id, dept_id, role_id, assigned_at) VALUES
-- Student in Computer Science
((SELECT user_id FROM central.users WHERE email = 'student@university.ac.uk'), 
 (SELECT dept_id FROM central.departments WHERE name = 'Computer Science'), 
 (SELECT role_id FROM central.roles WHERE name = 'student'), 
 NOW()),
-- Academic Staff in Computer Science
((SELECT user_id FROM central.users WHERE email = 'academic@university.ac.uk'), 
 (SELECT dept_id FROM central.departments WHERE name = 'Computer Science'), 
 (SELECT role_id FROM central.roles WHERE name = 'academic_staff'), 
 NOW()),
-- Department Admin for Computer Science
((SELECT user_id FROM central.users WHERE email = 'department@university.ac.uk'), 
 (SELECT dept_id FROM central.departments WHERE name = 'Computer Science'), 
 (SELECT role_id FROM central.roles WHERE name = 'department_admin'), 
 NOW()) 
ON CONFLICT (user_id, dept_id, role_id) DO NOTHING;
