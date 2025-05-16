

-- Add a global flag to modules table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'cs_schema'
                 AND table_name = 'modules'
                 AND column_name = 'is_global') THEN
    ALTER TABLE cs_schema.modules ADD COLUMN is_global BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create the enrollment_requests table to track module enrollment requests
CREATE TABLE IF NOT EXISTS cs_schema.enrollment_requests (
  request_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES cs_schema.students(user_id) ON DELETE CASCADE,
  module_id INT REFERENCES cs_schema.modules(module_id) ON DELETE CASCADE,
  reason TEXT,
  request_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  review_date TIMESTAMP,
  reviewer_notes TEXT,
  reviewed_by INT REFERENCES cs_schema.staff(user_id) ON DELETE SET NULL
);

-- Create a table for tracking enrollment requests to modules from other departments
-- This leverages the central database as a hub for cross-department enrollment
CREATE TABLE IF NOT EXISTS cs_schema.external_module_requests (
  request_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES cs_schema.students(user_id) ON DELETE CASCADE,
  target_dept_id INT NOT NULL, -- ID of the department offering the module
  target_module_id INT NOT NULL, -- ID of the module in the target department
  reason TEXT,
  request_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  response_date TIMESTAMP,
  response_notes TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_student_id ON cs_schema.enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_module_id ON cs_schema.enrollment_requests(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON cs_schema.enrollment_requests(status);
CREATE INDEX IF NOT EXISTS idx_external_module_requests_student_id ON cs_schema.external_module_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_external_module_requests_status ON cs_schema.external_module_requests(status);
