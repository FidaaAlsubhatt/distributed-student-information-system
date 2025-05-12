-- Updated to match cs_schema structure

SET search_path = cs_schema;

-- 1. Seed addresses
INSERT INTO addresses (line1, line2, city, state, postal_code, country, created_at) VALUES
('15 Privet Drive', 'Little Whinging', 'Surrey', 'England', 'GU12 5XT', 'United Kingdom', NOW()),
('42 College Road', 'Flat 3B', 'Manchester', 'Greater Manchester', 'M20 3JQ', 'United Kingdom', NOW()),
('27 Victoria Street', NULL, 'Edinburgh', 'Scotland', 'EH1 2HE', 'United Kingdom', NOW()),
('8 Cathedral Close', NULL, 'Durham', 'County Durham', 'DH1 3EH', 'United Kingdom', NOW()),
('19 Kensington Gardens', 'Apartment 7', 'London', 'Greater London', 'W8 4PX', 'United Kingdom', NOW()),
('67 Queens Road', NULL, 'Bristol', 'Bristol', 'BS8 1QU', 'United Kingdom', NOW()),
('23 Park Lane', 'Flat 12', 'Oxford', 'Oxfordshire', 'OX1 4PP', 'United Kingdom', NOW()),
('5 University Avenue', NULL, 'Cambridge', 'Cambridgeshire', 'CB2 1TN', 'United Kingdom', NOW()),
('31 Royal Terrace', NULL, 'Glasgow', 'Scotland', 'G12 8DZ', 'United Kingdom', NOW()),
('14 Scholars Way', NULL, 'Leeds', 'West Yorkshire', 'LS2 9JT', 'United Kingdom', NOW());

-- 2. Seed nationalities
INSERT INTO nationalities (name) VALUES
('British'), ('Scottish'), ('Welsh'), ('Irish'), ('International');

-- 3. Seed user_profiles
INSERT INTO user_profiles (first_name, last_name, date_of_birth, gender, personal_email, phone, address_id, nationality_id, created_at) VALUES
('James', 'Wilson', '2001-05-12', 'male', 'james.wilson@cs.university.ac.uk', '+44 7700 900123', 1, 1, NOW()),
('Emma', 'Taylor', '2002-08-23', 'female', 'emma.taylor@cs.university.ac.uk', '+44 7700 900124', 2, 1, NOW()),
('Oliver', 'Brown', '2000-11-05', 'male', 'oliver.brown@cs.university.ac.uk', '+44 7700 900125', 3, 1, NOW()),
('Sophie', 'Evans', '2001-02-17', 'female', 'sophie.evans@cs.university.ac.uk', '+44 7700 900126', 4, 1, NOW()),
('William', 'Jones', '2002-04-30', 'male', 'william.jones@cs.university.ac.uk', '+44 7700 900127', 5, 1, NOW()),
('Robert', 'Smith', '1975-09-18', 'male', 'robert.smith@cs.university.ac.uk', '+44 7700 900223', 6, 1, NOW()),
('Elizabeth', 'Johnson', '1968-03-24', 'female', 'elizabeth.johnson@cs.university.ac.uk', '+44 7700 900224', 7, 1, NOW()),
('Andrew', 'Davies', '1982-07-11', 'male', 'andrew.davies@cs.university.ac.uk', '+44 7700 900225', 8, 1, NOW()),
('Victoria', 'Williams', '1979-12-05', 'female', 'victoria.williams@cs.university.ac.uk', '+44 7700 900226', 9, 1, NOW()),
('Michael', 'Thomas', '1965-06-22', 'male', 'michael.thomas@cs.university.ac.uk', '+44 7700 900227', 10, 1, NOW());

-- 4. Seed students
INSERT INTO students (user_id, student_number, university_email, year, enroll_date, status) VALUES
(1, 'CS20210512', 'james.wilson@cs.university.ac.uk', 2, '2021-09-20', 'enrolled'),
(2, 'CS20220823', 'emma.taylor@cs.university.ac.uk', 1, '2022-09-19', 'enrolled'),
(3, 'CS20201105', 'oliver.brown@cs.university.ac.uk', 3, '2020-09-21', 'enrolled'),
(4, 'CS20210217', 'sophie.evans@cs.university.ac.uk', 2, '2021-09-20', 'enrolled'),
(5, 'CS20220430', 'william.jones@cs.university.ac.uk', 1, '2022-09-19', 'enrolled');

-- 5. Seed staff
INSERT INTO staff (user_id, staff_number, university_email, title, created_at) VALUES
(6, 'STAFF001', 'robert.smith@cs.university.ac.uk', 'Senior Lecturer', NOW()),
(7, 'STAFF002', 'elizabeth.johnson@cs.university.ac.uk', 'Professor', NOW()),
(8, 'STAFF003', 'andrew.davies@cs.university.ac.uk', 'Lecturer', NOW()),
(9, 'STAFF004', 'victoria.williams@cs.university.ac.uk', 'Senior Lecturer', NOW()),
(10, 'STAFF005', 'michael.thomas@cs.university.ac.uk', 'Professor', NOW());

-- 6. Seed programs
INSERT INTO programs (name, level, duration, status, created_at) VALUES
('BSc Computer Science', 'Undergraduate', 3, 'active', NOW()),
('MSc Advanced Computer Science', 'Postgraduate', 1, 'active', NOW()),
('MSc Data Science', 'Postgraduate', 1, 'active', NOW()),
('PhD Computer Science', 'Doctorate', 4, 'active', NOW());

-- 7. Seed semesters
INSERT INTO semesters (name, start_date, end_date) VALUES
('Autumn 2024', '2024-09-23', '2024-12-13'),
('Spring 2025', '2025-01-13', '2025-03-28'),
('Summer 2025', '2025-04-21', '2025-06-20');

-- 8. Seed modules
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

-- 9. Seed program modules
INSERT INTO program_modules (program_id, module_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 6), (1, 7), (1, 8),
(2, 4), (2, 5), (2, 9), (2, 10),
(3, 3), (3, 5), (3, 10);

-- 10. Seed module prerequisites
INSERT INTO module_prerequisites (module_id, prereq_id) VALUES
(2, 1), (3, 2), (4, 2), (5, 4),
(7, 1), (8, 7), (9, 6), (10, 9);

-- 11. Seed next of kin
INSERT INTO next_of_kin (student_id, name, relation, contact_number) VALUES
(1, 'Richard Wilson', 'Father', '+44 7700 800123'),
(2, 'Margaret Taylor', 'Mother', '+44 7700 800124'),
(3, 'Jennifer Brown', 'Mother', '+44 7700 800125'),
(4, 'David Evans', 'Father', '+44 7700 800126'),
(5, 'Catherine Jones', 'Mother', '+44 7700 800127');

-- 12. Seed locations
INSERT INTO locations (type, building, name, capacity, description) VALUES
('lecture_hall', 'Computer Science Building', 'Lecture Hall A', 200, 'Main lecture hall with full AV equipment'),
('lecture_hall', 'Computer Science Building', 'Lecture Hall B', 150, 'Secondary lecture hall'),
('lab', 'Computer Science Building', 'Lab 101', 50, 'Computer lab with 50 workstations'),
('lab', 'Computer Science Building', 'Lab 102', 30, 'Computer lab with 30 workstations'),
('seminar_room', 'Computer Science Building', 'Seminar Room 1', 25, 'Small seminar room'),
('office', 'Computer Science Building', 'Office 201', 1, 'Faculty office');

-- 13. Seed exams
INSERT INTO exams (module_id, title, exam_date, location_id) VALUES
(1, 'Introduction to Programming Final Exam', '2024-12-10 09:00:00', 1),
(2, 'Data Structures Final Exam', '2024-12-11 09:00:00', 1),
(3, 'Database Systems Final Exam', '2024-12-12 09:00:00', 2);

-- 14. Seed assignments
INSERT INTO assignments (module_id, title, description, due_date) VALUES
(1, 'Programming Basics', 'Use variables and loops', '2024-10-15'),
(2, 'Array Task', 'Implement array logic', '2024-10-25'),
(3, 'Database Design', 'Design ER schema', '2024-10-30');

-- 15. Seed student finances
INSERT INTO student_finances (academic_year, student_id, total_due, amount_paid, status, last_payment, notes, created_at, updated_at) VALUES
('2024', 1, 9250.00, 9250.00, 'paid', '2024-08-15', 'Paid in full', NOW(), NOW()),
('2024', 2, 9250.00, 4625.00, 'partial', '2024-08-20', 'First installment', NOW(), NOW());

-- 16. Seed payments
INSERT INTO payments (finance_id, payment_date, amount, method, reference_no, received_by) VALUES
(1, '2024-08-15', 9250.00, 'bank_transfer', 'BT20240815001', 'Finance Office'),
(2, '2024-08-20', 4625.00, 'bank_transfer', 'BT20240820001', 'Finance Office');


-- 17. Seed submissions
INSERT INTO submissions (assignment_id, student_id, file_path, submitted_at, grade, feedback) VALUES
(1, 1, '/submissions/james_wilson_programming_basics.zip', '2024-10-14 16:30:00', 85.5, 'Good logic and structure'),
(2, 1, '/submissions/james_wilson_functions.zip', '2024-11-18 14:00:00', 88.0, 'Well modularized'),
(3, 2, '/submissions/emma_taylor_array_task.zip', '2024-10-24 13:00:00', 75.0, 'Clean code but needs optimization'),
(1, 3, '/submissions/oliver_brown_linked_list.zip', '2024-11-24 11:45:00', 90.0, 'Excellent work and documentation');

-- 18. Seed module grades
INSERT INTO module_grades (student_id, module_id, grade, is_final, created_at) VALUES
(1, 1, 84.5, TRUE, NOW()),
(1, 2, 82.0, TRUE, NOW()),
(2, 1, 75.0, TRUE, NOW()),
(3, 4, 91.0, TRUE, NOW());

-- 19. Seed disciplinary_records
INSERT INTO disciplinary_records (student_id, incident, action_taken, appeal_status) VALUES
(2, 'Plagiarism in assignment CS101', 'Warning issued and resubmission allowed', 'closed'),
(4, 'Disruptive behavior during lab session', 'Verbal warning issued', 'pending');

-- 20. Seed extenuating_circumstances
INSERT INTO extenuating_circumstances (student_id, reason, documents, status, created_at) VALUES
(5, 'Medical emergency during midterms', 'medical_certificate_wj.pdf', 'approved', NOW()),
(2, 'Bereavement in family affecting coursework', 'bereavement_letter_et.pdf', 'pending', NOW());

-- 21. Seed enrollments
INSERT INTO enrollments (student_id, module_id, status, request_date) VALUES
(1, 1, 'registered', '2024-09-01'),
(1, 2, 'registered', '2024-09-01'),
(2, 1, 'registered', '2024-09-01'),
(3, 4, 'registered', '2024-09-01'),
(4, 6, 'registered', '2024-09-01');

-- 22. Seed timetables
INSERT INTO timetables (module_id, type, event_date, location_id) VALUES
(1, 'lecture', '2024-09-25 09:00:00', 1),
(1, 'lab', '2024-09-27 14:00:00', 3),
(2, 'lecture', '2024-09-26 11:00:00', 1),
(3, 'lecture', '2024-09-28 10:00:00', 2);
