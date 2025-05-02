-- ============================================
-- STUDENT AND STAFF NUMBER & EMAIL GENERATOR
-- ============================================
-- This script implements an automatic number and email generator for both
-- students and academic staff that works across all department schemas
-- in the distributed database system. It should be executed for each department database.

-- Create or replace the trigger function for student number and email generation
CREATE OR REPLACE FUNCTION dept_schema.fn_generate_student_number_and_email()
RETURNS TRIGGER AS $$
DECLARE
    dept_prefix TEXT;
    max_number INTEGER;
    new_numeric_suffix INTEGER;
    padded_number TEXT;
    schema_name TEXT;
BEGIN
    -- Only generate student_number if it's not provided
    IF NEW.student_number IS NULL OR NEW.student_number = '' THEN
        -- Get the current schema name (e.g., 'cs', 'math')
        schema_name := current_schema();
        
        -- Extract prefix from database name (e.g., cs_sis -> cs, math_sis -> math)
        SELECT SPLIT_PART(current_database(), '_', 1) INTO dept_prefix;
        
        -- Lock the table to prevent race conditions when generating sequential numbers
        EXECUTE 'LOCK TABLE ' || schema_name || '.students IN EXCLUSIVE MODE';
        
        -- Find the highest existing numeric suffix for this department prefix
        -- with 'S' prefix for students
        EXECUTE format('
            SELECT COALESCE(
                MAX(
                    CASE 
                        WHEN student_number ~ (''^%sS[0-9]{4}$'')
                        THEN CAST(SUBSTRING(student_number FROM %s + 2 FOR 4) AS INTEGER)
                        ELSE 0
                    END
                ), 
                0
            ) FROM %I.students
        ', dept_prefix, LENGTH(dept_prefix), schema_name) INTO max_number;
        
        -- Increment to get the new number
        new_numeric_suffix := max_number + 1;
        
        -- Zero-pad the number to 4 digits
        padded_number := LPAD(new_numeric_suffix::TEXT, 4, '0');
        
        -- Set the new student_number with 'S' prefix to distinguish from staff
        NEW.student_number := LOWER(dept_prefix || 'S' || padded_number);
    END IF;
    
    -- Generate university email if not provided
    IF NEW.university_email IS NULL OR NEW.university_email = '' THEN
        -- Use the student_number (either provided or just generated) to create the email
        NEW.university_email := LOWER(NEW.student_number || '@university.edu');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger function for staff number and email generation
CREATE OR REPLACE FUNCTION dept_schema.fn_generate_staff_number_and_email()
RETURNS TRIGGER AS $$
DECLARE
    dept_prefix TEXT;
    max_number INTEGER;
    new_numeric_suffix INTEGER;
    padded_number TEXT;
    schema_name TEXT;
BEGIN
    -- Only generate staff_number if it's not provided
    IF NEW.staff_number IS NULL OR NEW.staff_number = '' THEN
        -- Get the current schema name (e.g., 'cs', 'math')
        schema_name := current_schema();
        
        -- Extract prefix from database name (e.g., cs_sis -> cs, math_sis -> math)
        SELECT SPLIT_PART(current_database(), '_', 1) INTO dept_prefix;
        
        -- Lock the table to prevent race conditions when generating sequential numbers
        EXECUTE 'LOCK TABLE ' || schema_name || '.staff IN EXCLUSIVE MODE';
        
        -- Find the highest existing numeric suffix for this department prefix
        -- with 'F' prefix for Faculty/staff
        EXECUTE format('
            SELECT COALESCE(
                MAX(
                    CASE 
                        WHEN staff_number ~ (''^%sF[0-9]{4}$'')
                        THEN CAST(SUBSTRING(staff_number FROM %s + 2 FOR 4) AS INTEGER)
                        ELSE 0
                    END
                ), 
                0
            ) FROM %I.staff
        ', dept_prefix, LENGTH(dept_prefix), schema_name) INTO max_number;
        
        -- Increment to get the new number
        new_numeric_suffix := max_number + 1;
        
        -- Zero-pad the number to 4 digits
        padded_number := LPAD(new_numeric_suffix::TEXT, 4, '0');
        
        -- Set the new staff_number with 'F' prefix to distinguish from students
        NEW.staff_number := LOWER(dept_prefix || 'F' || padded_number);
    END IF;
    
    -- Generate university email if not provided
    IF NEW.university_email IS NULL OR NEW.university_email = '' THEN
        -- Use the staff_number (either provided or just generated) to create the email
        NEW.university_email := LOWER(NEW.staff_number || '@university.edu');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers on the students and staff tables
-- This needs to be executed for each department schema
DO $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Get current schema
    schema_name := current_schema();
    
    -- Drop existing student trigger if it exists
    EXECUTE format('
        DROP TRIGGER IF EXISTS trg_generate_student_number_and_email 
        ON %I.students
    ', schema_name);
    
    -- Create the student trigger
    EXECUTE format('
        CREATE TRIGGER trg_generate_student_number_and_email
        BEFORE INSERT ON %I.students
        FOR EACH ROW
        EXECUTE FUNCTION %I.fn_generate_student_number_and_email()
    ', schema_name, schema_name);
    
    -- Drop existing staff trigger if it exists
    EXECUTE format('
        DROP TRIGGER IF EXISTS trg_generate_staff_number_and_email 
        ON %I.staff
    ', schema_name);
    
    -- Create the staff trigger
    EXECUTE format('
        CREATE TRIGGER trg_generate_staff_number_and_email
        BEFORE INSERT ON %I.staff
        FOR EACH ROW
        EXECUTE FUNCTION %I.fn_generate_staff_number_and_email()
    ', schema_name, schema_name);
    
    RAISE NOTICE 'Student and staff number/email generator triggers installed successfully in schema: %', schema_name;
END;
$$;
