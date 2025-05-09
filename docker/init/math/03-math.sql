CREATE SCHEMA IF NOT EXISTS math_schema;
SET search_path = math_schema;

-- 2.1 Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id            SERIAL PRIMARY KEY,
  line1         TEXT    NOT NULL,
  line2         TEXT,
  city          VARCHAR(100),
  state         VARCHAR(100),
  postal_code   VARCHAR(20),
  country       VARCHAR(100),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2.2 User Profiles (students & staff)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id       SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender        VARCHAR(20),
  email         VARCHAR(255),
  phone         VARCHAR(20),
  address_id    INT REFERENCES addresses(id),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2.3 Academic Structure
CREATE TABLE IF NOT EXISTS programs (
  program_id    SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  level         VARCHAR(20)  NOT NULL,
  duration      INT          NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS semesters (
  semester_id   SERIAL PRIMARY KEY,
  name          VARCHAR(20) NOT NULL,
  start_date    DATE        NOT NULL,
  end_date      DATE        NOT NULL
);

CREATE TABLE IF NOT EXISTS modules (
  module_id     SERIAL PRIMARY KEY,
  code          VARCHAR(20) NOT NULL UNIQUE,
  title         VARCHAR(255) NOT NULL,
  semester_id   INT         NOT NULL REFERENCES semesters(semester_id),
  capacity      INT         NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS program_modules (
  id            SERIAL PRIMARY KEY,
  program_id    INT    NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
  module_id     INT    NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  UNIQUE(program_id, module_id)
);

CREATE TABLE IF NOT EXISTS module_prerequisites (
  id            SERIAL PRIMARY KEY,
  module_id     INT NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  prereq_id     INT NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  UNIQUE(module_id, prereq_id)
);

-- 2.4 People & Enrollment
CREATE TABLE IF NOT EXISTS students (
  user_id        SERIAL PRIMARY KEY,
  student_number VARCHAR(50) NOT NULL UNIQUE,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(20),
  year           INT,
  enroll_date    DATE,
  status         VARCHAR(20) NOT NULL DEFAULT 'enrolled',
  address_id     INT REFERENCES addresses(id)
);

CREATE TABLE IF NOT EXISTS staff (
  staff_id       SERIAL PRIMARY KEY,
  user_id        INT          NOT NULL,
  staff_number   VARCHAR(50)  NOT NULL UNIQUE,
  title          VARCHAR(50),
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(20),
  address_id     INT REFERENCES addresses(id),
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS next_of_kin (
  id             SERIAL PRIMARY KEY,
  student_id     INT    NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  relation       VARCHAR(50),
  contact_number VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id  SERIAL PRIMARY KEY,
  student_id     INT    NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  module_id      INT    NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  status         VARCHAR(20) NOT NULL DEFAULT 'registered',
  request_date   TIMESTAMP   NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, module_id)
);

-- 2.5 Assessments & Schedules
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id  SERIAL PRIMARY KEY,
  module_id      INT    NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  title          TEXT   NOT NULL,
  description    TEXT,
  due_date       DATE   NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  submission_id  SERIAL PRIMARY KEY,
  assignment_id  INT    NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  student_id     INT    NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  file_path      TEXT,
  submitted_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  grade          NUMERIC(5,2),
  feedback       TEXT
);

CREATE TABLE IF NOT EXISTS locations (
  location_id    SERIAL PRIMARY KEY,
  type           VARCHAR(20),
  building       VARCHAR(100),
  name           VARCHAR(100) NOT NULL,
  capacity       INT,
  description    TEXT
);

CREATE TABLE IF NOT EXISTS exams (
  exam_id        SERIAL PRIMARY KEY,
  module_id      INT     NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  title          TEXT    NOT NULL,
  exam_date      TIMESTAMP NOT NULL,
  location_id    INT     REFERENCES locations(location_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timetables (
  timetable_id   SERIAL PRIMARY KEY,
  module_id      INT     NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
  type           VARCHAR(20),
  event_date     TIMESTAMP NOT NULL,
  location_id    INT     REFERENCES locations(location_id) ON DELETE CASCADE
);

-- 2.6 Discipline & Exceptions
CREATE TABLE IF NOT EXISTS disciplinary_records (
  id             SERIAL PRIMARY KEY,
  student_id     INT    NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  incident       TEXT   NOT NULL,
  action_taken   TEXT,
  appeal_status  VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS extenuating_circumstances (
  id             SERIAL PRIMARY KEY,
  student_id     INT    NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  reason         TEXT   NOT NULL,
  documents      TEXT,
  status         VARCHAR(20) DEFAULT 'pending',
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2.7 Finance & Payments
CREATE TABLE IF NOT EXISTS student_finances (
  id             SERIAL PRIMARY KEY,
  academic_year  VARCHAR(9) NOT NULL,
  student_id     INT        NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  total_due      NUMERIC(10,2),
  amount_paid    NUMERIC(10,2),
  status         VARCHAR(20) DEFAULT 'owing',
  last_payment   DATE,
  notes          TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id     SERIAL PRIMARY KEY,
  finance_id     INT    NOT NULL REFERENCES student_finances(id) ON DELETE CASCADE,
  payment_date   DATE   NOT NULL,
  amount         NUMERIC(10,2) NOT NULL,
  method         VARCHAR(50),
  reference_no   VARCHAR(100),
  received_by    VARCHAR(255)
);
