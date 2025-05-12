CREATE OR REPLACE VIEW central.vw_pending_users AS
SELECT
  'cs' AS department,
  s.user_id,
  s.university_email AS email,
  up.first_name,
  up.last_name,
  up.date_of_birth,
  'student' AS role
FROM fdw_cs.students s
JOIN fdw_cs.user_profiles up ON up.user_id = s.user_id

UNION ALL

SELECT
  'cs',
  sf.user_id,
  sf.university_email,
  up.first_name,
  up.last_name,
  up.date_of_birth,
  'academic_staff'
FROM fdw_cs.staff sf
JOIN fdw_cs.user_profiles up ON up.user_id = sf.user_id

UNION ALL

SELECT
  'math',
  s.user_id,
  s.university_email,
  up.first_name,
  up.last_name,
  up.date_of_birth,
  'student'
FROM fdw_math.students s
JOIN fdw_math.user_profiles up ON up.user_id = s.user_id

UNION ALL

SELECT
  'math',
  sf.user_id,
  sf.university_email,
  up.first_name,
  up.last_name,
  up.date_of_birth,
  'academic_staff'
FROM fdw_math.staff sf
JOIN fdw_math.user_profiles up ON up.user_id = sf.user_id;
