-- Create views in the central database for global modules and cross-department enrollment
SET search_path = central;

-- This view aggregates all modules marked as global from all departments
-- It leverages the existing FDW connections to each department
CREATE OR REPLACE VIEW central.global_modules AS

-- CS Department Global Modules
SELECT 
  m.module_id,
  d.dept_id,
  m.module_id || '-' || d.dept_id AS global_module_id,
  m.title,
  m.code,
  m.credits,
  m.semester_id,
  m.description,
  m.is_active,
  m.is_global,
  d.name AS department_name,
  'cs' AS department_code
FROM fdw_cs.modules m
JOIN central.departments d ON d.schema_prefix = 'cs_schema'
WHERE m.is_global = TRUE AND m.is_active = TRUE

UNION ALL

-- Math Department Global Modules
SELECT 
  m.module_id,
  d.dept_id,
  m.module_id || '-' || d.dept_id AS global_module_id,
  m.title,
  m.code,
  m.credits,
  m.semester_id,
  m.description,
  m.is_active,
  m.is_global,
  d.name AS department_name,
  'math' AS department_code
FROM fdw_math.modules m
JOIN central.departments d ON d.schema_prefix = 'math_schema'
WHERE m.is_global = TRUE AND m.is_active = TRUE;
