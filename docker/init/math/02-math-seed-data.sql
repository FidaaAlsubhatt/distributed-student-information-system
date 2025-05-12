-- Updated to match math_schema structure

SET search_path = math_schema;

-- 1. Seed addresses
INSERT INTO addresses (line1, line2, city, state, postal_code, country, created_at) VALUES
('28 Chestnut Avenue', NULL, 'Birmingham', 'West Midlands', 'B15 2TT', 'United Kingdom', NOW()),
('7 Regent Street', 'Flat 12', 'London', 'Greater London', 'SW1Y 4LR', 'United Kingdom', NOW()),
('45 University Road', NULL, 'Sheffield', 'South Yorkshire', 'S10 2TN', 'United Kingdom', NOW()),
('12 Clifton Terrace', NULL, 'Brighton', 'East Sussex', 'BN1 3HA', 'United Kingdom', NOW()),
('33 Queens Park', 'Apartment 5', 'Cardiff', 'Wales', 'CF10 3DN', 'United Kingdom', NOW()),
('19 Highfield Road', NULL, 'Nottingham', 'Nottinghamshire', 'NG7 2PD', 'United Kingdom', NOW()),
('52 King Street', NULL, 'Lancaster', 'Lancashire', 'LA1 1RE', 'United Kingdom', NOW()),
('8 College Lane', NULL, 'York', 'North Yorkshire', 'YO10 5DD', 'United Kingdom', NOW()),
('24 Warwick Avenue', NULL, 'Coventry', 'West Midlands', 'CV4 7AL', 'United Kingdom', NOW()),
('61 St Andrews Street', NULL, 'Aberdeen', 'Scotland', 'AB25 1JA', 'United Kingdom', NOW());

-- 2. Seed nationalities
INSERT INTO nationalities (name) VALUES
('British'), ('Scottish'), ('Welsh'), ('Irish'), ('International');

-- 3. Seed user_profiles
INSERT INTO user_profiles (first_name, last_name, date_of_birth, gender, personal_email, phone, address_id, nationality_id, created_at) VALUES
('Charlotte', 'Hughes', '2002-03-14', 'female', 'charlotte.hughes@math.university.ac.uk', '+44 7700 900133', 1, 1, NOW()),
('Harry', 'Roberts', '2001-09-28', 'male', 'harry.roberts@math.university.ac.uk', '+44 7700 900134', 2, 1, NOW()),
('Emily', 'Clarke', '2003-01-07', 'female', 'emily.clarke@math.university.ac.uk', '+44 7700 900135', 3, 1, NOW()),
('George', 'Walker', '2002-07-19', 'male', 'george.walker@math.university.ac.uk', '+44 7700 900136', 4, 1, NOW()),
('Olivia', 'Martin', '2001-11-02', 'female', 'olivia.martin@math.university.ac.uk', '+44 7700 900137', 5, 1, NOW()),
('Jonathan', 'Phillips', '1970-04-12', 'male', 'jonathan.phillips@math.university.ac.uk', '+44 7700 900233', 6, 1, NOW()),
('Sophia', 'Richardson', '1978-08-05', 'female', 'sophia.richardson@math.university.ac.uk', '+44 7700 900234', 7, 1, NOW()),
('Benjamin', 'Cooper', '1983-12-19', 'male', 'benjamin.cooper@math.university.ac.uk', '+44 7700 900235', 8, 1, NOW()),
('Katherine', 'Lewis', '1967-05-28', 'female', 'katherine.lewis@math.university.ac.uk', '+44 7700 900236', 9, 1, NOW()),
('Daniel', 'Morgan', '1980-10-14', 'male', 'daniel.morgan@math.university.ac.uk', '+44 7700 900237', 10, 1, NOW());

-- 4. Seed students
INSERT INTO students (user_id, student_number, university_email, year, enroll_date, status) VALUES
(1, 'MATH20220314', 'charlotte.hughes@math.university.ac.uk', 2, '2022-09-19', 'enrolled'),
(2, 'MATH20210928', 'harry.roberts@math.university.ac.uk', 3, '2021-09-20', 'enrolled'),
(3, 'MATH20230107', 'emily.clarke@math.university.ac.uk', 1, '2023-09-18', 'enrolled'),
(4, 'MATH20220719', 'george.walker@math.university.ac.uk', 2, '2022-09-19', 'enrolled'),
(5, 'MATH20210102', 'olivia.martin@math.university.ac.uk', 3, '2021-09-20', 'enrolled');

-- 5. Seed staff
INSERT INTO staff (user_id, staff_number, university_email, title, created_at) VALUES
(6, 'MSTAFF001', 'jonathan.phillips@math.university.ac.uk', 'Professor', NOW()),
(7, 'MSTAFF002', 'sophia.richardson@math.university.ac.uk', 'Senior Lecturer', NOW()),
(8, 'MSTAFF003', 'benjamin.cooper@math.university.ac.uk', 'Lecturer', NOW()),
(9, 'MSTAFF004', 'katherine.lewis@math.university.ac.uk', 'Professor', NOW()),
(10, 'MSTAFF005', 'daniel.morgan@math.university.ac.uk', 'Senior Lecturer', NOW());

-- 6. Seed programs
INSERT INTO programs (name, level, duration, status, created_at) VALUES
('BSc Mathematics', 'Undergraduate', 3, 'active', NOW()),
('MSc Mathematical Finance', 'Postgraduate', 1, 'active', NOW());

-- 7. Seed semesters
INSERT INTO semesters (name, start_date, end_date) VALUES
('Autumn 2024', '2024-09-23', '2024-12-13'),
('Spring 2025', '2025-01-13', '2025-03-28');

-- 8. Seed modules
INSERT INTO modules (code, title, semester_id, capacity, is_active) VALUES
('MATH101', 'Calculus I', 1, 150, TRUE),
('MATH201', 'Linear Algebra', 1, 120, TRUE),
('MATH301', 'Real Analysis', 2, 80, TRUE);

-- 9. Seed program_modules
INSERT INTO program_modules (program_id, module_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 2), (2, 3);

-- 10. Seed module_prerequisites
INSERT INTO module_prerequisites (module_id, prereq_id) VALUES
(3, 1), (3, 2);

-- 11. Seed enrollments
INSERT INTO enrollments (student_id, module_id, status, request_date) VALUES
(1, 1, 'registered', NOW()),
(2, 2, 'registered', NOW()),
(3, 3, 'registered', NOW());

-- 12. Seed assignments
INSERT INTO assignments (module_id, title, description, due_date) VALUES
(1, 'Limits and Continuity', 'Problems on limits and continuity', '2024-10-10'),
(2, 'Matrix Algebra', 'Linear algebra assignments', '2024-10-20');

-- 13. Seed submissions
INSERT INTO submissions (assignment_id, student_id, file_path, submitted_at, grade, feedback) VALUES
(1, 1, '/submissions/charlotte_limits.pdf', NOW(), 87.5, 'Excellent work'),
(2, 2, '/submissions/harry_matrix.pdf', NOW(), 75.0, 'Good effort');

-- 14. Seed module_grades
INSERT INTO module_grades (student_id, module_id, grade, is_final, created_at) VALUES
(1, 1, 88.5, TRUE, NOW()),
(2, 2, 76.0, TRUE, NOW());

-- 15. Seed locations
INSERT INTO locations (type, building, name, capacity, description) VALUES
('lecture_hall', 'Maths Building', 'Room A', 150, 'Main lecture hall'),
('tutorial_room', 'Maths Building', 'Room B', 30, 'Tutorial room');

-- 16. Seed exams
INSERT INTO exams (module_id, title, exam_date, location_id) VALUES
(1, 'Calculus I Exam', '2024-12-10 10:00:00', 1),
(2, 'Linear Algebra Exam', '2024-12-11 10:00:00', 1);

-- 17. Seed timetables
INSERT INTO timetables (module_id, type, event_date, location_id) VALUES
(1, 'lecture', '2024-09-25 09:00:00', 1),
(2, 'tutorial', '2024-09-26 14:00:00', 2);

-- 18. Seed next_of_kin
INSERT INTO next_of_kin (student_id, name, relation, contact_number) VALUES
(1, 'Thomas Hughes', 'Father', '+44 7700 800133'),
(2, 'Sarah Roberts', 'Mother', '+44 7700 800134');

-- 19. Seed disciplinary_records
INSERT INTO disciplinary_records (student_id, incident, action_taken, appeal_status) VALUES
(2, 'Late submission', 'Warning issued', 'closed');

-- 20. Seed extenuating_circumstances
INSERT INTO extenuating_circumstances (student_id, reason, documents, status, created_at) VALUES
(3, 'Family emergency', 'family_note.pdf', 'approved', NOW());

-- 21. Seed student_finances
INSERT INTO student_finances (academic_year, student_id, total_due, amount_paid, status, last_payment, notes, created_at, updated_at) VALUES
('2024', 1, 9250.00, 9250.00, 'paid', '2024-08-20', 'Paid in full', NOW(), NOW()),
('2024', 2, 9250.00, 4625.00, 'partial', '2024-08-21', 'First installment received', NOW(), NOW());

-- 22. Seed payments
INSERT INTO payments (finance_id, payment_date, amount, method, reference_no, received_by) VALUES
(1, '2024-08-20', 9250.00, 'bank_transfer', 'BT20240820001', 'Finance Office'),
(2, '2024-08-21', 4625.00, 'bank_transfer', 'BT20240821001', 'Finance Office');
