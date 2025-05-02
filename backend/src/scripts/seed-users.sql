-- Seed data for the new database schema

-- 1. Seed roles first
INSERT INTO public.roles (name, scope, description) VALUES
('student', 'department', 'Regular student role'),
('academic_staff', 'department', 'Academic staff member'),
('department_admin', 'department', 'Department administrator'),
('central_admin', 'central', 'Central system administrator')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed departments
INSERT INTO public.departments (dept_id, name, host, port, dbname, sslmode, schema_prefix, status, contact_email) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Computer Science', 'localhost', 5433, 'cs_sis', 'require', 'cs_schema', 'active', 'cs@university.edu'),
('550e8400-e29b-41d4-a716-446655440000', 'Mathematics', 'localhost', 5434, 'math_sis', 'require', 'math_schema', 'active', 'math@university.edu')
ON CONFLICT (name) DO NOTHING;

-- 3. Seed users with bcrypt hashed passwords (all passwords are 'password123')
INSERT INTO public.users (user_id, email, password_hash, status, created_at) VALUES
-- Student users
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'student@university.edu', '$2b$10$JBVz7YBBbSlgvj3HAYQIaO9mz637Af2RfQKgV3gtSK/FkdnL/9tzi', 'active', NOW()),
-- Academic staff users
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'academic@university.edu', '$2b$10$JBVz7YBBbSlgvj3HAYQIaO9mz637Af2RfQKgV3gtSK/FkdnL/9tzi', 'active', NOW()),
-- Department admin users
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'department@university.edu', '$2b$10$JBVz7YBBbSlgvj3HAYQIaO9mz637Af2RfQKgV3gtSK/FkdnL/9tzi', 'active', NOW()),
-- Central admin users
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'admin@university.edu', '$2b$10$JBVz7YBBbSlgvj3HAYQIaO9mz637Af2RfQKgV3gtSK/FkdnL/9tzi', 'active', NOW())
ON CONFLICT (email) DO NOTHING;

-- 4. Seed user profiles
INSERT INTO public.user_profiles (user_id, first_name, last_name, phone, office, timezone) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'John', 'Student', '+1234567890', NULL, 'UTC'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Jane', 'Academic', '+1234567891', 'CS-101', 'UTC'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'David', 'Department', '+1234567892', 'CS-201', 'UTC'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Sarah', 'Admin', '+1234567893', 'ADMIN-101', 'UTC')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Assign global roles to users
INSERT INTO public.user_roles (user_id, role_id, assigned_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', (SELECT role_id FROM public.roles WHERE name = 'student'), NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', (SELECT role_id FROM public.roles WHERE name = 'academic_staff'), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', (SELECT role_id FROM public.roles WHERE name = 'department_admin'), NOW()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', (SELECT role_id FROM public.roles WHERE name = 'central_admin'), NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 6. Assign department-specific roles
INSERT INTO public.user_department_roles (user_id, dept_id, role_id, assigned_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', (SELECT role_id FROM public.roles WHERE name = 'student'), NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', (SELECT role_id FROM public.roles WHERE name = 'academic_staff'), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', (SELECT role_id FROM public.roles WHERE name = 'department_admin'), NOW())
ON CONFLICT DO NOTHING;
