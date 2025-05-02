#!/bin/bash
# Script to deploy the student number generator trigger to all department databases

# Path to the SQL script
SQL_SCRIPT="./student-number-generator.sql"

# Check if the SQL script exists
if [ ! -f "$SQL_SCRIPT" ]; then
  echo "Error: SQL script not found at $SQL_SCRIPT"
  exit 1
fi

# Deploy to CS department database
echo "Deploying student number generator to CS department database..."
PGPASSWORD=cspass psql -h localhost -p 5433 -U cs_admin -d cs_sis -f "$SQL_SCRIPT"

# Deploy to Math department database
echo "Deploying student number generator to Math department database..."
PGPASSWORD=mathpass psql -h localhost -p 5434 -U math_admin -d math_sis -f "$SQL_SCRIPT"

echo "Deployment complete!"
