# Distributed Student Information System

## Project Overview

The Distributed Student Information System is a comprehensive educational management platform designed for universities with multiple academic departments. The system employs a distributed database architecture where each department maintains sovereign control over its data while sharing necessary information with central administration.

### Key Features

- **Distributed Database Architecture**: Each department (CS, Mathematics) maintains its own database with schema isolation
- **Foreign Data Wrapper (FDW) Integration**: Central administration has read-only federated access to departmental data
- **Role-Based Access Control**: Four user roles with appropriate permissions (Student, Academic Staff, Department Admin, Central Admin)
- **Cross-Department Enrollment**: Students can enroll in modules from other departments
- **Academic Staff Portal**: Faculty can manage modules, assignments, grades, and student performance
- **JWT Authentication**: Secure token-based authentication with role and department claims

## System Architecture

- **Department Databases**:
  - CS Department: PostgreSQL 14 | Database: cs_sis, Schema: cs_schema
  - Math Department: PostgreSQL 14 | Database: math_sis, Schema: math_schema
  
- **Central Administration**:
  - Global DB: PostgreSQL 14 | Database: global_sis, Schema: central, fdw_cs, fdw_math

- **Technology Stack**:
  - Backend: Node.js + Express + TypeScript
  - Frontend: React + TypeScript
  - Database: PostgreSQL 14 with FDW extension
  - Authentication: JWT

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js (v14+)
- npm or yarn
- PostgreSQL client tools (optional, for direct DB access)

### 1. Database Setup with Docker

The system uses Docker to create three separate PostgreSQL instances for the distributed architecture:

```bash
# Navigate to the project root directory
cd distributed-student-information-system

# Start all database containers
docker-compose -f docker/docker-compose.yml up -d
```

This will start three database containers:
- cs_db (Computer Science Department)
- math_db (Mathematics Department)
- global_db (Central Administration)

### 2. Database Schema and FDW Configuration

After starting the containers, run the setup scripts to create schemas and configure Foreign Data Wrapper (FDW):

```bash
# Create schemas in each department database
docker exec -it cs_db psql -U postgres -f /docker-entrypoint-initdb.d/01-init-schema.sql
docker exec -it math_db psql -U postgres -f /docker-entrypoint-initdb.d/01-init-schema.sql

# Create FDW users and permissions
docker exec -it cs_db psql -U postgres -f /docker-entrypoint-initdb.d/02-fdw-users.sql
docker exec -it math_db psql -U postgres -f /docker-entrypoint-initdb.d/02-fdw-users.sql

# Configure FDW in the global database
docker exec -it global_db psql -U postgres -f /docker-entrypoint-initdb.d/01-init-central.sql
docker exec -it global_db psql -U postgres -f /docker-entrypoint-initdb.d/02-fdw-setup.sql
docker exec -it global_db psql -U postgres -f /docker-entrypoint-initdb.d/03-global-modules-view.sql
```

### 4. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create .env file (modify as needed)
cp .env.example .env

# Start the backend in development mode
npm run dev
```

The backend server will start on http://localhost:3001 by default.

### 5. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (modify as needed)
cp .env.example .env

# Start the frontend in development mode
npm run dev
```

The React development server will start on http://localhost:3000.


## Troubleshooting

### Database Connection Issues
- Check Docker container status: `docker ps`
- Verify PostgreSQL is running: `docker logs cs_db` (or other container name)
- Test connections: `psql -h localhost -p 5432 -U postgres -d cs_sis`

### FDW Configuration
- Verify FDW extension: `SELECT * FROM pg_extension WHERE extname = 'postgres_fdw';`
- Check server mappings: `SELECT * FROM pg_foreign_server;`
- Test a federated query: `SELECT * FROM fdw_cs.modules LIMIT 5;`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

