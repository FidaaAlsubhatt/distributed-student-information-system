-- Create views in the central database for global modules and cross-department enrollment
SET search_path = central;

-- This view aggregates all modules marked as global from all departments
-- It leverages the existing FDW connections to each department
CREATE OR REPLACE VIEW central.global_modules AS

-- CS Department Global Modules
SELECT 
  m.module_id,
  m.title,
  m.code,
  m.credits,
  m.semester_id,
  m.description,
  m.is_active,
  m.is_global,
  d.name AS department_name,
  'cs' AS department_code,
  d.dept_id
FROM fdw_cs.modules m
JOIN central.departments d ON d.schema_prefix = 'cs_schema'
WHERE m.is_global = TRUE AND m.is_active = TRUE

UNION ALL

-- Math Department Global Modules
SELECT 
  m.module_id,
  m.title,
  m.code,
  m.credits,
  m.semester_id,
  m.description,
  m.is_active,
  m.is_global,
  d.name AS department_name,
  'math' AS department_code,
  d.dept_id
FROM fdw_math.modules m
JOIN central.departments d ON d.schema_prefix = 'math_schema'
WHERE m.is_global = TRUE AND m.is_active = TRUE;

-- This view collects all cross-department enrollment requests
-- It serves as a central registry for departments to check requests for their modules
CREATE OR REPLACE VIEW central.cross_department_requests AS

-- CS Department external module requests
SELECT 
  r.request_id,
  r.student_id,
  r.target_module_id,
  r.target_dept_id,
  r.reason,
  r.request_date,
  r.status,
  r.response_date,
  r.response_notes,
  'cs' AS student_department_code,
  d.name AS target_department_name,
  LOWER(SUBSTRING(d.name, 1, 5)) AS target_department_code,
  cs_u.first_name || ' ' || cs_u.last_name AS student_name
FROM fdw_cs.external_module_requests r
JOIN central.departments d ON d.dept_id = r.target_dept_id
JOIN fdw_cs.user_profiles cs_u ON cs_u.user_id = r.student_id

UNION ALL

-- Math Department external module requests
SELECT 
  r.request_id,
  r.student_id,
  r.target_module_id,
  r.target_dept_id,
  r.reason,
  r.request_date,
  r.status,
  r.response_date,
  r.response_notes,
  'math' AS student_department_code,
  d.name AS target_department_name,
  LOWER(SUBSTRING(d.name, 1, 5)) AS target_department_code,
  math_u.first_name || ' ' || math_u.last_name AS student_name
FROM fdw_math.external_module_requests r
JOIN central.departments d ON d.dept_id = r.target_dept_id
JOIN fdw_math.user_profiles math_u ON math_u.user_id = r.student_id;
