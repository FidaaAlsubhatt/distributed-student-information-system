-- student view

CREATE OR REPLACE VIEW central.student_directory AS

-- CS Department
SELECT 
  uim.global_user_id,
  s.user_id          AS local_id,
  s.student_number,
  s.university_email,
  up.first_name,
  up.last_name,
  up.date_of_birth,
  s.year             AS academic_year,
  s.enroll_date,
  s.status,
  'cs'               AS department_code
FROM central.user_id_map uim
JOIN central.departments d ON d.dept_id = uim.dept_id
JOIN fdw_cs.students s ON s.user_id = uim.local_user_id AND d.schema_prefix = 'cs_schema'
JOIN fdw_cs.user_profiles up ON s.user_id = up.user_id

UNION ALL

-- Math Department
SELECT 
  uim.global_user_id,
  s.user_id          AS local_id,
  s.student_number,
  s.university_email,
  up.first_name,
  up.last_name,
  up.date_of_birth,
  s.year             AS academic_year,
  s.enroll_date,
  s.status,
  'math'             AS department_code
FROM central.user_id_map uim
JOIN central.departments d ON d.dept_id = uim.dept_id
JOIN fdw_math.students s ON s.user_id = uim.local_user_id AND d.schema_prefix = 'math_schema'
JOIN fdw_math.user_profiles up ON s.user_id = up.user_id;

-- central.module_enrollments

CREATE OR REPLACE VIEW central.module_enrollments AS
SELECT 
  'cs_' || e.student_id AS global_student_id,
  e.student_id AS local_student_id,
  e.module_id,
  e.status,
  e.request_date,
  'cs' AS department_code
FROM fdw_cs.enrollments e

UNION ALL

SELECT 
  'math_' || e.student_id,
  e.student_id,
  e.module_id,
  e.status,
  e.request_date,
  'math'
FROM fdw_math.enrollments e;

--central.grades_overview

CREATE OR REPLACE VIEW central.grades_overview AS
SELECT 
  'cs_' || g.student_id AS global_student_id,
  g.student_id,
  g.module_id,
  g.grade,
  g.is_final,
  g.created_at,
  'cs' AS department_code
FROM fdw_cs.module_grades g

UNION ALL

SELECT 
  'math_' || g.student_id,
  g.student_id,
  g.module_id,
  g.grade,
  g.is_final,
  g.created_at,
  'math'
FROM fdw_math.module_grades g;

--central.staff_directory

CREATE OR REPLACE VIEW central.staff_directory AS
SELECT 
  s.user_id,
  up.first_name,
  up.last_name,
  s.staff_number,
  s.university_email,
  s.title,
  s.created_at,
  'cs' AS department_code
FROM fdw_cs.staff s
JOIN fdw_cs.user_profiles up ON s.user_id = up.user_id

UNION ALL

SELECT 
  s.user_id,
  up.first_name,
  up.last_name,
  s.staff_number,
  s.university_email,
  s.title,
  s.created_at,
  'math'
FROM fdw_math.staff s
JOIN fdw_math.user_profiles up ON s.user_id = up.user_id;

--central.exam_schedule

CREATE OR REPLACE VIEW central.exam_schedule AS
SELECT 
  module_id,
  title,
  exam_date,
  location_id,
  'cs' AS department_code
FROM fdw_cs.exams

UNION ALL

SELECT 
  module_id,
  title,
  exam_date,
  location_id,
  'math'
FROM fdw_math.exams;
