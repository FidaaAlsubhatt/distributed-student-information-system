-- CS Department Seed Data (UK-Centric)
-- This script populates the Computer Science department schema with realistic UK-centric data

SET search_path = cs_schema;

-- 1. Seed addresses (UK addresses)
INSERT INTO addresses (line1, line2, city, state, postal_code, country, created_at) VALUES
-- Student addresses
('15 Privet Drive', 'Little Whinging', 'Surrey', 'England', 'GU12 5XT', 'United Kingdom', NOW()),
('42 College Road', 'Flat 3B', 'Manchester', 'Greater Manchester', 'M20 3JQ', 'United Kingdom', NOW()),
('27 Victoria Street', NULL, 'Edinburgh', 'Scotland', 'EH1 2HE', 'United Kingdom', NOW()),
('8 Cathedral Close', NULL, 'Durham', 'County Durham', 'DH1 3EH', 'United Kingdom', NOW()),
('19 Kensington Gardens', 'Apartment 7', 'London', 'Greater London', 'W8 4PX', 'United Kingdom', NOW()),
-- Staff addresses
('67 Queens Road', NULL, 'Bristol', 'Bristol', 'BS8 1QU', 'United Kingdom', NOW()),
('23 Park Lane', 'Flat 12', 'Oxford', 'Oxfordshire', 'OX1 4PP', 'United Kingdom', NOW()),
('5 University Avenue', NULL, 'Cambridge', 'Cambridgeshire', 'CB2 1TN', 'United Kingdom', NOW()),
('31 Royal Terrace', NULL, 'Glasgow', 'Scotland', 'G12 8DZ', 'United Kingdom', NOW()),
('14 Scholars Way', NULL, 'Leeds', 'West Yorkshire', 'LS2 9JT', 'United Kingdom', NOW());

-- 2. Seed user profiles for students and staff
INSERT INTO user_profiles (first_name, last_name, date_of_birth, gender, email, phone, address_id, created_at) VALUES
-- Students
('James', 'Wilson', '2001-05-12', 'male', 'james.wilson@cs.university.ac.uk', '+44 7700 900123', 1, NOW()),
('Emma', 'Taylor', '2002-08-23', 'female', 'emma.taylor@cs.university.ac.uk', '+44 7700 900124', 2, NOW()),
('Oliver', 'Brown', '2000-11-05', 'male', 'oliver.brown@cs.university.ac.uk', '+44 7700 900125', 3, NOW()),
('Sophie', 'Evans', '2001-02-17', 'female', 'sophie.evans@cs.university.ac.uk', '+44 7700 900126', 4, NOW()),
('William', 'Jones', '2002-04-30', 'male', 'william.jones@cs.university.ac.uk', '+44 7700 900127', 5, NOW()),
-- Academic Staff
('Dr. Robert', 'Smith', '1975-09-18', 'male', 'robert.smith@cs.university.ac.uk', '+44 7700 900223', 6, NOW()),
('Prof. Elizabeth', 'Johnson', '1968-03-24', 'female', 'elizabeth.johnson@cs.university.ac.uk', '+44 7700 900224', 7, NOW()),
('Dr. Andrew', 'Davies', '1982-07-11', 'male', 'andrew.davies@cs.university.ac.uk', '+44 7700 900225', 8, NOW()),
('Dr. Victoria', 'Williams', '1979-12-05', 'female', 'victoria.williams@cs.university.ac.uk', '+44 7700 900226', 9, NOW()),
('Prof. Michael', 'Thomas', '1965-06-22', 'male', 'michael.thomas@cs.university.ac.uk', '+44 7700 900227', 10, NOW());

-- 3. Seed academic structure
INSERT INTO programs (name, level, duration, status, created_at) VALUES
('BSc Computer Science', 'Undergraduate', 3, 'active', NOW()),
('MSc Advanced Computer Science', 'Postgraduate', 1, 'active', NOW()),
('MSc Data Science', 'Postgraduate', 1, 'active', NOW()),
('PhD Computer Science', 'Doctorate', 4, 'active', NOW());

-- 4. Seed semesters
INSERT INTO semesters (name, start_date, end_date) VALUES
('Autumn 2024', '2024-09-23', '2024-12-13'),
('Spring 2025', '2025-01-13', '2025-03-28'),
('Summer 2025', '2025-04-21', '2025-06-20');

-- 5. Seed modules
INSERT INTO modules (code, title, semester_id, capacity, is_active) VALUES
('CS101', 'Introduction to Programming', 1, 150, TRUE),
('CS201', 'Data Structures and Algorithms', 1, 120, TRUE),
('CS301', 'Database Systems', 1, 100, TRUE),
('CS401', 'Artificial Intelligence', 1, 80, TRUE),
('CS501', 'Machine Learning', 1, 60, TRUE),
('CS102', 'Computer Architecture', 2, 150, TRUE),
('CS202', 'Software Engineering', 2, 120, TRUE),
('CS302', 'Web Development', 2, 100, TRUE),
('CS402', 'Computer Networks', 2, 80, TRUE),
('CS502', 'Cybersecurity', 2, 60, TRUE);

-- 6. Seed program modules
INSERT INTO program_modules (program_id, module_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 6), (1, 7), (1, 8),
(2, 4), (2, 5), (2, 9), (2, 10),
(3, 3), (3, 5), (3, 10);

-- 7. Seed module prerequisites
INSERT INTO module_prerequisites (module_id, prereq_id) VALUES
(2, 1), -- Data Structures requires Intro to Programming
(3, 2), -- Database Systems requires Data Structures
(4, 2), -- AI requires Data Structures
(5, 4), -- Machine Learning requires AI
(7, 1), -- Software Engineering requires Intro to Programming
(8, 7), -- Web Development requires Software Engineering
(9, 6), -- Networks requires Computer Architecture
(10, 9); -- Cybersecurity requires Networks

-- 8. Seed students
INSERT INTO students (user_id, student_number, email, phone, year, enroll_date, status, address_id) VALUES
(1, 'CS20210512', 'james.wilson@cs.university.ac.uk', '+44 7700 900123', 2, '2021-09-20', 'enrolled', 1),
(2, 'CS20220823', 'emma.taylor@cs.university.ac.uk', '+44 7700 900124', 1, '2022-09-19', 'enrolled', 2),
(3, 'CS20201105', 'oliver.brown@cs.university.ac.uk', '+44 7700 900125', 3, '2020-09-21', 'enrolled', 3),
(4, 'CS20210217', 'sophie.evans@cs.university.ac.uk', '+44 7700 900126', 2, '2021-09-20', 'enrolled', 4),
(5, 'CS20220430', 'william.jones@cs.university.ac.uk', '+44 7700 900127', 1, '2022-09-19', 'enrolled', 5);

-- 9. Seed staff
INSERT INTO staff (staff_id, user_id, staff_number, title, email, phone, address_id, created_at) VALUES
(1, 6, 'STAFF001', 'Senior Lecturer', 'robert.smith@cs.university.ac.uk', '+44 7700 900223', 6, NOW()),
(2, 7, 'STAFF002', 'Professor', 'elizabeth.johnson@cs.university.ac.uk', '+44 7700 900224', 7, NOW()),
(3, 8, 'STAFF003', 'Lecturer', 'andrew.davies@cs.university.ac.uk', '+44 7700 900225', 8, NOW()),
(4, 9, 'STAFF004', 'Senior Lecturer', 'victoria.williams@cs.university.ac.uk', '+44 7700 900226', 9, NOW()),
(5, 10, 'STAFF005', 'Professor', 'michael.thomas@cs.university.ac.uk', '+44 7700 900227', 10, NOW());

-- 10. Seed next of kin for students
INSERT INTO next_of_kin (student_id, name, relation, contact_number) VALUES
(1, 'Richard Wilson', 'Father', '+44 7700 800123'),
(2, 'Margaret Taylor', 'Mother', '+44 7700 800124'),
(3, 'Jennifer Brown', 'Mother', '+44 7700 800125'),
(4, 'David Evans', 'Father', '+44 7700 800126'),
(5, 'Catherine Jones', 'Mother', '+44 7700 800127');

-- 11. Seed enrollments
INSERT INTO enrollments (student_id, module_id, status, request_date) VALUES
-- James Wilson (Year 2)
(1, 2, 'registered', '2024-08-15'),
(1, 3, 'registered', '2024-08-15'),
(1, 7, 'registered', '2024-08-15'),
(1, 8, 'registered', '2024-08-15'),
-- Emma Taylor (Year 1)
(2, 1, 'registered', '2024-08-20'),
(2, 6, 'registered', '2024-08-20'),
-- Oliver Brown (Year 3)
(3, 4, 'registered', '2024-08-10'),
(3, 5, 'registered', '2024-08-10'),
(3, 9, 'registered', '2024-08-10'),
(3, 10, 'registered', '2024-08-10'),
-- Sophie Evans (Year 2)
(4, 2, 'registered', '2024-08-17'),
(4, 3, 'registered', '2024-08-17'),
(4, 7, 'registered', '2024-08-17'),
(4, 8, 'registered', '2024-08-17'),
-- William Jones (Year 1)
(5, 1, 'registered', '2024-08-22'),
(5, 6, 'registered', '2024-08-22');

-- 12. Seed locations
INSERT INTO locations (type, building, name, capacity, description) VALUES
('lecture_hall', 'Computer Science Building', 'Lecture Hall A', 200, 'Main lecture hall with full AV equipment'),
('lecture_hall', 'Computer Science Building', 'Lecture Hall B', 150, 'Secondary lecture hall'),
('lab', 'Computer Science Building', 'Lab 101', 50, 'Computer lab with 50 workstations'),
('lab', 'Computer Science Building', 'Lab 102', 30, 'Computer lab with 30 workstations'),
('seminar_room', 'Computer Science Building', 'Seminar Room 1', 25, 'Small seminar room'),
('seminar_room', 'Computer Science Building', 'Seminar Room 2', 25, 'Small seminar room'),
('office', 'Computer Science Building', 'Office 201', 1, 'Faculty office'),
('office', 'Computer Science Building', 'Office 202', 1, 'Faculty office'),
('office', 'Computer Science Building', 'Office 203', 1, 'Faculty office'),
('office', 'Computer Science Building', 'Office 204', 1, 'Faculty office');

-- 13. Seed assignments
INSERT INTO assignments (module_id, title, description, due_date) VALUES
(1, 'Programming Basics', 'Create a simple program using variables, loops, and conditionals', '2024-10-15'),
(1, 'Functions and Methods', 'Implement a program using functions and methods', '2024-11-20'),
(2, 'Array Implementation', 'Implement various array operations and analyze their complexity', '2024-10-20'),
(2, 'Linked List Implementation', 'Implement a linked list and its operations', '2024-11-25'),
(3, 'Database Design', 'Design a database schema for a given scenario', '2024-10-25'),
(3, 'SQL Queries', 'Write SQL queries to retrieve and manipulate data', '2024-11-30');

-- 14. Seed timetables
INSERT INTO timetables (module_id, type, event_date, location_id) VALUES
-- CS101 - Introduction to Programming
(1, 'lecture', '2024-09-24 09:00:00', 1),
(1, 'lecture', '2024-10-01 09:00:00', 1),
(1, 'lab', '2024-09-26 14:00:00', 3),
(1, 'lab', '2024-10-03 14:00:00', 3),
-- CS201 - Data Structures and Algorithms
(2, 'lecture', '2024-09-24 11:00:00', 1),
(2, 'lecture', '2024-10-01 11:00:00', 1),
(2, 'lab', '2024-09-26 16:00:00', 3),
(2, 'lab', '2024-10-03 16:00:00', 3),
-- CS301 - Database Systems
(3, 'lecture', '2024-09-25 09:00:00', 2),
(3, 'lecture', '2024-10-02 09:00:00', 2),
(3, 'lab', '2024-09-27 14:00:00', 4),
(3, 'lab', '2024-10-04 14:00:00', 4);

-- 15. Seed exams
INSERT INTO exams (module_id, title, exam_date, location_id) VALUES
(1, 'Introduction to Programming Final Exam', '2024-12-10 09:00:00', 1),
(2, 'Data Structures and Algorithms Final Exam', '2024-12-11 09:00:00', 1),
(3, 'Database Systems Final Exam', '2024-12-12 09:00:00', 2),
(4, 'Artificial Intelligence Final Exam', '2024-12-13 09:00:00', 2),
(5, 'Machine Learning Final Exam', '2024-12-16 09:00:00', 1);

-- 16. Seed student finances
INSERT INTO student_finances (academic_year, student_id, total_due, amount_paid, status, last_payment, notes, created_at, updated_at) VALUES
(2024, 1, 9250.00, 9250.00, 'paid', '2024-08-15', 'Full payment received', NOW(), NOW()),
(2024, 2, 9250.00, 4625.00, 'partial', '2024-08-20', 'First installment received', NOW(), NOW()),
(2024, 3, 9250.00, 9250.00, 'paid', '2024-08-10', 'Full payment received', NOW(), NOW()),
(2024, 4, 9250.00, 6166.67, 'partial', '2024-08-17', 'Two installments received', NOW(), NOW()),
(2024, 5, 9250.00, 3083.33, 'partial', '2024-08-22', 'First installment received', NOW(), NOW());

-- 17. Seed payments
INSERT INTO payments (finance_id, payment_date, amount, method, reference_no, received_by) VALUES
(1, '2024-08-15', 9250.00, 'bank_transfer', 'BT20240815001', 'Finance Office'),
(2, '2024-08-20', 4625.00, 'bank_transfer', 'BT20240820001', 'Finance Office'),
(3, '2024-08-10', 9250.00, 'bank_transfer', 'BT20240810001', 'Finance Office'),
(4, '2024-08-17', 3083.33, 'bank_transfer', 'BT20240817001', 'Finance Office'),
(4, '2024-10-17', 3083.34, 'bank_transfer', 'BT20241017001', 'Finance Office'),
(5, '2024-08-22', 3083.33, 'bank_transfer', 'BT20240822001', 'Finance Office');
