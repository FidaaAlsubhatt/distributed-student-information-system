-- Mathematics Department Seed Data (UK-Centric)
-- This script populates the Mathematics department schema with realistic UK-centric data

SET search_path = math_schema;

-- 1. Seed addresses (UK addresses)
INSERT INTO addresses (line1, line2, city, state, postal_code, country, created_at) VALUES
-- Student addresses
('28 Chestnut Avenue', NULL, 'Birmingham', 'West Midlands', 'B15 2TT', 'United Kingdom', NOW()),
('7 Regent Street', 'Flat 12', 'London', 'Greater London', 'SW1Y 4LR', 'United Kingdom', NOW()),
('45 University Road', NULL, 'Sheffield', 'South Yorkshire', 'S10 2TN', 'United Kingdom', NOW()),
('12 Clifton Terrace', NULL, 'Brighton', 'East Sussex', 'BN1 3HA', 'United Kingdom', NOW()),
('33 Queens Park', 'Apartment 5', 'Cardiff', 'Wales', 'CF10 3DN', 'United Kingdom', NOW()),
-- Staff addresses
('19 Highfield Road', NULL, 'Nottingham', 'Nottinghamshire', 'NG7 2PD', 'United Kingdom', NOW()),
('52 King Street', NULL, 'Lancaster', 'Lancashire', 'LA1 1RE', 'United Kingdom', NOW()),
('8 College Lane', NULL, 'York', 'North Yorkshire', 'YO10 5DD', 'United Kingdom', NOW()),
('24 Warwick Avenue', NULL, 'Coventry', 'West Midlands', 'CV4 7AL', 'United Kingdom', NOW()),
('61 St Andrews Street', NULL, 'Aberdeen', 'Scotland', 'AB25 1JA', 'United Kingdom', NOW());

-- 2. Seed user profiles for students and staff
INSERT INTO user_profiles (first_name, last_name, date_of_birth, gender, email, phone, address_id, created_at) VALUES
-- Students
('Charlotte', 'Hughes', '2002-03-14', 'female', 'charlotte.hughes@math.university.ac.uk', '+44 7700 900133', 1, NOW()),
('Harry', 'Roberts', '2001-09-28', 'male', 'harry.roberts@math.university.ac.uk', '+44 7700 900134', 2, NOW()),
('Emily', 'Clarke', '2003-01-07', 'female', 'emily.clarke@math.university.ac.uk', '+44 7700 900135', 3, NOW()),
('George', 'Walker', '2002-07-19', 'male', 'george.walker@math.university.ac.uk', '+44 7700 900136', 4, NOW()),
('Olivia', 'Martin', '2001-11-02', 'female', 'olivia.martin@math.university.ac.uk', '+44 7700 900137', 5, NOW()),
-- Academic Staff
('Prof. Jonathan', 'Phillips', '1970-04-12', 'male', 'jonathan.phillips@math.university.ac.uk', '+44 7700 900233', 6, NOW()),
('Dr. Sophia', 'Richardson', '1978-08-05', 'female', 'sophia.richardson@math.university.ac.uk', '+44 7700 900234', 7, NOW()),
('Dr. Benjamin', 'Cooper', '1983-12-19', 'male', 'benjamin.cooper@math.university.ac.uk', '+44 7700 900235', 8, NOW()),
('Prof. Katherine', 'Lewis', '1967-05-28', 'female', 'katherine.lewis@math.university.ac.uk', '+44 7700 900236', 9, NOW()),
('Dr. Daniel', 'Morgan', '1980-10-14', 'male', 'daniel.morgan@math.university.ac.uk', '+44 7700 900237', 10, NOW());

-- 3. Seed academic structure
INSERT INTO programs (name, level, duration, status, created_at) VALUES
('BSc Mathematics', 'Undergraduate', 3, 'active', NOW()),
('BSc Mathematics with Statistics', 'Undergraduate', 3, 'active', NOW()),
('MSc Mathematical Finance', 'Postgraduate', 1, 'active', NOW()),
('MSc Applied Mathematics', 'Postgraduate', 1, 'active', NOW()),
('PhD Mathematics', 'Doctorate', 4, 'active', NOW());

-- 4. Seed semesters
INSERT INTO semesters (name, start_date, end_date) VALUES
('Autumn 2024', '2024-09-23', '2024-12-13'),
('Spring 2025', '2025-01-13', '2025-03-28'),
('Summer 2025', '2025-04-21', '2025-06-20');

-- 5. Seed modules
INSERT INTO modules (code, title, semester_id, capacity, is_active) VALUES
('MATH101', 'Calculus I', 1, 150, TRUE),
('MATH201', 'Linear Algebra', 1, 120, TRUE),
('MATH301', 'Real Analysis', 1, 80, TRUE),
('MATH401', 'Number Theory', 1, 60, TRUE),
('MATH501', 'Differential Equations', 1, 80, TRUE),
('MATH102', 'Calculus II', 2, 150, TRUE),
('MATH202', 'Abstract Algebra', 2, 100, TRUE),
('MATH302', 'Probability Theory', 2, 120, TRUE),
('MATH402', 'Mathematical Statistics', 2, 80, TRUE),
('MATH502', 'Numerical Analysis', 2, 60, TRUE);

-- 6. Seed program modules
INSERT INTO program_modules (program_id, module_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 6), (1, 7), -- BSc Mathematics
(2, 1), (2, 2), (2, 5), (2, 8), (2, 9), -- BSc Mathematics with Statistics
(3, 3), (3, 5), (3, 9), (3, 10), -- MSc Mathematical Finance
(4, 3), (4, 5), (4, 7), (4, 10); -- MSc Applied Mathematics

-- 7. Seed module prerequisites
INSERT INTO module_prerequisites (module_id, prereq_id) VALUES
(3, 1), -- Real Analysis requires Calculus I
(3, 2), -- Real Analysis requires Linear Algebra
(4, 3), -- Number Theory requires Real Analysis
(5, 1), -- Differential Equations requires Calculus I
(6, 1), -- Calculus II requires Calculus I
(7, 2), -- Abstract Algebra requires Linear Algebra
(8, 1), -- Probability Theory requires Calculus I
(9, 8), -- Mathematical Statistics requires Probability Theory
(10, 5); -- Numerical Analysis requires Differential Equations

-- 8. Seed students
INSERT INTO students (user_id, student_number, email, phone, year, enroll_date, status, address_id) VALUES
(1, 'MATH20220314', 'charlotte.hughes@math.university.ac.uk', '+44 7700 900133', 2, '2022-09-19', 'enrolled', 1),
(2, 'MATH20210928', 'harry.roberts@math.university.ac.uk', '+44 7700 900134', 3, '2021-09-20', 'enrolled', 2),
(3, 'MATH20230107', 'emily.clarke@math.university.ac.uk', '+44 7700 900135', 1, '2023-09-18', 'enrolled', 3),
(4, 'MATH20220719', 'george.walker@math.university.ac.uk', '+44 7700 900136', 2, '2022-09-19', 'enrolled', 4),
(5, 'MATH20210102', 'olivia.martin@math.university.ac.uk', '+44 7700 900137', 3, '2021-09-20', 'enrolled', 5);

-- 9. Seed staff
INSERT INTO staff (staff_id, user_id, staff_number, title, email, phone, address_id, created_at) VALUES
(1, 6, 'MSTAFF001', 'Professor', 'jonathan.phillips@math.university.ac.uk', '+44 7700 900233', 6, NOW()),
(2, 7, 'MSTAFF002', 'Senior Lecturer', 'sophia.richardson@math.university.ac.uk', '+44 7700 900234', 7, NOW()),
(3, 8, 'MSTAFF003', 'Lecturer', 'benjamin.cooper@math.university.ac.uk', '+44 7700 900235', 8, NOW()),
(4, 9, 'MSTAFF004', 'Professor', 'katherine.lewis@math.university.ac.uk', '+44 7700 900236', 9, NOW()),
(5, 10, 'MSTAFF005', 'Senior Lecturer', 'daniel.morgan@math.university.ac.uk', '+44 7700 900237', 10, NOW());

-- 10. Seed next of kin for students
INSERT INTO next_of_kin (student_id, name, relation, contact_number) VALUES
(1, 'Thomas Hughes', 'Father', '+44 7700 800133'),
(2, 'Sarah Roberts', 'Mother', '+44 7700 800134'),
(3, 'Michael Clarke', 'Father', '+44 7700 800135'),
(4, 'Elizabeth Walker', 'Mother', '+44 7700 800136'),
(5, 'James Martin', 'Father', '+44 7700 800137');

-- 11. Seed enrollments
INSERT INTO enrollments (student_id, module_id, status, request_date) VALUES
-- Charlotte Hughes (Year 2)
(1, 3, 'registered', '2024-08-16'),
(1, 5, 'registered', '2024-08-16'),
(1, 7, 'registered', '2024-08-16'),
(1, 10, 'registered', '2024-08-16'),
-- Harry Roberts (Year 3)
(2, 4, 'registered', '2024-08-12'),
(2, 9, 'registered', '2024-08-12'),
(2, 10, 'registered', '2024-08-12'),
-- Emily Clarke (Year 1)
(3, 1, 'registered', '2024-08-25'),
(3, 2, 'registered', '2024-08-25'),
(3, 8, 'registered', '2024-08-25'),
-- George Walker (Year 2)
(4, 3, 'registered', '2024-08-18'),
(4, 5, 'registered', '2024-08-18'),
(4, 7, 'registered', '2024-08-18'),
-- Olivia Martin (Year 3)
(5, 4, 'registered', '2024-08-14'),
(5, 9, 'registered', '2024-08-14'),
(5, 10, 'registered', '2024-08-14');

-- 12. Seed locations
INSERT INTO locations (type, building, name, capacity, description) VALUES
('lecture_hall', 'Mathematics Building', 'Lecture Theatre 1', 180, 'Main mathematics lecture theatre'),
('lecture_hall', 'Mathematics Building', 'Lecture Theatre 2', 120, 'Secondary lecture theatre'),
('seminar_room', 'Mathematics Building', 'Seminar Room A', 40, 'Seminar room with whiteboard walls'),
('seminar_room', 'Mathematics Building', 'Seminar Room B', 40, 'Seminar room with projector'),
('computer_lab', 'Mathematics Building', 'Computer Lab 1', 60, 'Computer lab with mathematical software'),
('tutorial_room', 'Mathematics Building', 'Tutorial Room 1', 20, 'Small tutorial room'),
('tutorial_room', 'Mathematics Building', 'Tutorial Room 2', 20, 'Small tutorial room'),
('office', 'Mathematics Building', 'Office 101', 1, 'Faculty office'),
('office', 'Mathematics Building', 'Office 102', 1, 'Faculty office'),
('office', 'Mathematics Building', 'Office 103', 1, 'Faculty office');

-- 13. Seed assignments
INSERT INTO assignments (module_id, title, description, due_date) VALUES
(1, 'Limits and Continuity', 'Solve problems related to limits and continuity of functions', '2024-10-18'),
(1, 'Differentiation', 'Apply differentiation techniques to various functions', '2024-11-22'),
(2, 'Matrix Operations', 'Perform operations on matrices and solve systems of linear equations', '2024-10-25'),
(2, 'Vector Spaces', 'Explore properties of vector spaces and linear transformations', '2024-11-29'),
(3, 'Sequence Convergence', 'Prove convergence of sequences using epsilon-delta definitions', '2024-10-30'),
(3, 'Series and Convergence Tests', 'Apply various tests to determine convergence of infinite series', '2024-12-04');

-- 14. Seed timetables
INSERT INTO timetables (module_id, type, event_date, location_id) VALUES
-- MATH101 - Calculus I
(1, 'lecture', '2024-09-24 10:00:00', 1),
(1, 'lecture', '2024-10-01 10:00:00', 1),
(1, 'tutorial', '2024-09-26 11:00:00', 6),
(1, 'tutorial', '2024-10-03 11:00:00', 6),
-- MATH201 - Linear Algebra
(2, 'lecture', '2024-09-24 14:00:00', 1),
(2, 'lecture', '2024-10-01 14:00:00', 1),
(2, 'tutorial', '2024-09-26 15:00:00', 7),
(2, 'tutorial', '2024-10-03 15:00:00', 7),
-- MATH301 - Real Analysis
(3, 'lecture', '2024-09-25 10:00:00', 2),
(3, 'lecture', '2024-10-02 10:00:00', 2),
(3, 'seminar', '2024-09-27 11:00:00', 3),
(3, 'seminar', '2024-10-04 11:00:00', 3);

-- 15. Seed exams
INSERT INTO exams (module_id, title, exam_date, location_id) VALUES
(1, 'Calculus I Final Exam', '2024-12-10 10:00:00', 1),
(2, 'Linear Algebra Final Exam', '2024-12-11 10:00:00', 1),
(3, 'Real Analysis Final Exam', '2024-12-12 10:00:00', 2),
(4, 'Number Theory Final Exam', '2024-12-13 10:00:00', 2),
(5, 'Differential Equations Final Exam', '2024-12-16 10:00:00', 1);

-- 16. Seed student finances
INSERT INTO student_finances (academic_year, student_id, total_due, amount_paid, status, last_payment, notes, created_at, updated_at) VALUES
(2024, 1, 9250.00, 9250.00, 'paid', '2024-08-16', 'Full payment received', NOW(), NOW()),
(2024, 2, 9250.00, 9250.00, 'paid', '2024-08-12', 'Full payment received', NOW(), NOW()),
(2024, 3, 9250.00, 3083.33, 'partial', '2024-08-25', 'First installment received', NOW(), NOW()),
(2024, 4, 9250.00, 6166.67, 'partial', '2024-08-18', 'Two installments received', NOW(), NOW()),
(2024, 5, 9250.00, 9250.00, 'paid', '2024-08-14', 'Full payment received', NOW(), NOW());

-- 17. Seed payments
INSERT INTO payments (finance_id, payment_date, amount, method, reference_no, received_by) VALUES
(1, '2024-08-16', 9250.00, 'bank_transfer', 'BT20240816001', 'Finance Office'),
(2, '2024-08-12', 9250.00, 'bank_transfer', 'BT20240812001', 'Finance Office'),
(3, '2024-08-25', 3083.33, 'bank_transfer', 'BT20240825001', 'Finance Office'),
(4, '2024-08-18', 3083.33, 'bank_transfer', 'BT20240818001', 'Finance Office'),
(4, '2024-10-18', 3083.34, 'bank_transfer', 'BT20241018001', 'Finance Office'),
(5, '2024-08-14', 9250.00, 'bank_transfer', 'BT20240814001', 'Finance Office');
