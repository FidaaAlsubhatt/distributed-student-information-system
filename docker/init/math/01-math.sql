-- SCHEMA: math_schema
CREATE SCHEMA IF NOT EXISTS math_schema;
SET search_path = math_schema;

-- 1. Reference Tables

CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nationalities (
  nationality_id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);


-- 2. Core User Tables

CREATE TABLE user_profiles (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(30),
  personal_email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address_id INT REFERENCES addresses(id),
  nationality_id INT REFERENCES nationalities(nationality_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
  user_id INT PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  student_number VARCHAR(50) UNIQUE NOT NULL,
  university_email VARCHAR(255) UNIQUE NOT NULL,
  year INT,
  enroll_date DATE,
  status VARCHAR(20) DEFAULT 'enrolled'
);

CREATE TABLE staff (
  user_id INT PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  staff_number VARCHAR(50) UNIQUE NOT NULL,
  university_email VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Academic Structure

CREATE TABLE programs (
  program_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  level VARCHAR(20) NOT NULL,
  duration INT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE semesters (
  semester_id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);

CREATE TABLE modules (
  module_id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  semester_id INT NOT NULL REFERENCES semesters(semester_id),
  capacity INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE program_modules (
  id SERIAL PRIMARY KEY,
  program_id INT REFERENCES programs(program_id) ON DELETE CASCADE,
  module_id INT REFERENCES modules(module_id) ON DELETE CASCADE,
  UNIQUE(program_id, module_id)
);

CREATE TABLE module_prerequisites (
  id SERIAL PRIMARY KEY,
  module_id INT REFERENCES modules(module_id) ON DELETE CASCADE,
  prereq_id INT REFERENCES modules(module_id) ON DELETE CASCADE,
  UNIQUE(module_id, prereq_id)
);

-- 4. Enrollments and Assessment

CREATE TABLE enrollments (
  enrollment_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(user_id) ON DELETE CASCADE,
  module_id INT REFERENCES modules(module_id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered',
  request_date TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, module_id)
);

CREATE TABLE assignments (
  assignment_id SERIAL PRIMARY KEY,
  module_id INT REFERENCES modules(module_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL
);

CREATE TABLE submissions (
  submission_id SERIAL PRIMARY KEY,
  assignment_id INT REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  student_id INT REFERENCES students(user_id) ON DELETE CASCADE,
  file_path TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  grade NUMERIC(5,2),
  feedback TEXT
);

CREATE TABLE module_grades (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(user_id) ON DELETE CASCADE,
  module_id INT REFERENCES modules(module_id) ON DELETE CASCADE,
  grade NUMERIC(5,2) NOT NULL,
  is_final BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, module_id)
);

-- 5. Scheduling and Locations

CREATE TABLE locations (
  location_id SERIAL PRIMARY KEY,
  type VARCHAR(20),
  building VARCHAR(100),
  name VARCHAR(100) NOT NULL,
  capacity INT,
  description TEXT
);

CREATE TABLE exams (
  exam_id SERIAL PRIMARY KEY,
  module_id INT REFERENCES modules(module_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_date TIMESTAMP NOT NULL,
  location_id INT REFERENCES locations(location_id) ON DELETE CASCADE
);

CREATE TABLE timetables (
  timetable_id SERIAL PRIMARY KEY,
  module_id INT REFERENCES modules(module_id) ON DELETE CASCADE,
  type VARCHAR(20),
  event_date TIMESTAMP NOT NULL,
  location_id INT REFERENCES locations(location_id) ON DELETE CASCADE
);

-- 6. Welfare and Conduct

CREATE TABLE next_of_kin (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(50),
  contact_number VARCHAR(20)
);

CREATE TABLE disciplinary_records (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(user_id) ON DELETE CASCADE,
  incident TEXT NOT NULL,
  action_taken TEXT,
  appeal_status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE extenuating_circumstances (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  documents TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Finance

CREATE TABLE student_finances (
  id SERIAL PRIMARY KEY,
  academic_year VARCHAR(9) NOT NULL,
  student_id INT REFERENCES students(user_id) ON DELETE CASCADE,
  total_due NUMERIC(10,2),
  amount_paid NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'owing',
  last_payment DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, academic_year)
);

CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  finance_id INT REFERENCES student_finances(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method VARCHAR(50),
  reference_no VARCHAR(100),
  received_by VARCHAR(255)
);
