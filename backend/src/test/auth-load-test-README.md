# Authentication System Load Testing

This directory contains scripts for load testing the authentication endpoints of the Distributed Student Information System.

## Prerequisites

To run the load tests, you need to install k6:

```bash
# For macOS
brew install k6

# For Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Running the Load Tests

### Step 1: Ensure your backend server is running

Before starting the tests, make sure your backend server is running:

```bash
# From your project root directory
cd /Users/fidaaalsubhat/Downloads/distributed-student-information-system/backend
npm run dev
```

### Step 2: Run the load test

```bash
# From your project test directory
cd /Users/fidaaalsubhat/Downloads/distributed-student-information-system/backend/src/test
k6 run auth-load-test.js
```

### Step 3: Generate a detailed report (optional)

For more detailed analysis:

```bash
# Output JSON results
k6 run --out json=auth-test-results.json auth-load-test.js

# Generate a report (if you have k6's reporting tools installed)
k6 report auth-test-results.json
```

## Understanding Test Results

The load test generates several important metrics:

1. **HTTP Request Duration**: Overall response times
2. **Login Duration**: Time taken for authentication requests
   - `template_login_duration`: Template accounts with hardcoded passwords
   - `regular_login_duration`: Regular accounts with bcrypt hashing
3. **Token Verification Duration**: Time taken to verify JWT tokens
4. **Success/Failure Rates**: Percentage of successful vs failed requests
5. **Request Rates**: Number of requests per second the system can handle

## Test Configuration

The test is configured to run in stages:
- 30 second warm-up with 10 users
- 1 minute ramp-up to 50 users
- 2 minute steady state with 50 users
- 30 second ramp-down to 0

## Report Template

After running the test, copy the output statistics to fill in the report template below:

```markdown
# Authentication System Load Test Report

## Executive Summary
This report presents the findings of a load test conducted on the authentication system of our Distributed Student Information System. The test simulated up to 50 concurrent users performing authentication operations (login, token verification, logout) over a 4-minute period.

## Test Environment
- **System Under Test:** Authentication API (authController.ts)
- **Test Date:** [DATE]
- **Test Duration:** 4 minutes
- **Peak Virtual Users:** 50
- **Test Tool:** k6 v[VERSION]
- **Backend Environment:** [ENVIRONMENT]

## Performance Metrics

### Response Time
| Endpoint        | Min (ms) | Avg (ms) | Median (ms) | p90 (ms) | p95 (ms) | Max (ms) |
|-----------------|----------|----------|-------------|----------|----------|----------|
| /auth/signin    | [TBD]    | [TBD]    | [TBD]       | [TBD]    | [TBD]    | [TBD]    |
| /auth/verify    | [TBD]    | [TBD]    | [TBD]       | [TBD]    | [TBD]    | [TBD]    |
| /auth/logout    | [TBD]    | [TBD]    | [TBD]       | [TBD]    | [TBD]    | [TBD]    |

### Throughput
- **Total Requests:** [TBD]
- **Requests/second:** [TBD]
- **Successful Login Rate:** [TBD]%
- **Failed Login Rate:** [TBD]%
- **Data Transferred:** [TBD] MB

### Server Metrics (monitor during test)
- **CPU Utilization:** [TBD]%
- **Memory Usage:** [TBD] MB
- **Database Connections:** [TBD] peak

## Template Account vs Regular Account Performance
| Account Type | Avg Response Time (ms) | Success Rate (%) |
|--------------|------------------------|------------------|
| Template     | [TBD]                  | [TBD]           |
| Regular      | [TBD]                  | [TBD]           |

## Key Findings

### Strengths
1. [Describe what worked well in the authentication system]
2. [Highlight any performance wins]

### Bottlenecks Identified
1. [Describe any performance bottlenecks found]
2. [Note where the system slowed down under load]

### Error Analysis
- [Document any errors observed during testing]

## Recommendations

1. **[High Impact] Recommendation 1:**
   - [Detailed explanation]

2. **[Medium Impact] Recommendation 2:**
   - [Detailed explanation]

3. **[Low Impact] Recommendation 3:**
   - [Detailed explanation]

## Conclusion
[Overall assessment of the authentication system's performance]

## Next Steps
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]
```

## Adding Performance Metrics to the Backend

To get more detailed metrics on database query performance, you can modify the authentication controller to include timing information. Here's how:

1. Add timing in your authController.ts login function:

```typescript
// In login function
const startTime = process.hrtime();

// ... existing code ...

// At the end of the function, before sending response:
const endTime = process.hrtime(startTime);
const executionTimeMs = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
res.setHeader('X-DB-Query-Time', executionTimeMs);
res.status(200).json({
  token,
  userId: user.user_id,
  roles: roles,
  departmentRoles: departmentRoles,
  profile: profile
});
```

2. This will allow the load test to capture database query timing information for further analysis.

## Monitoring During Test

While the test is running, you should monitor:

1. **CPU Usage**: Use Activity Monitor (Mac) or htop (Linux)
2. **Memory Usage**: Watch for any memory leaks
3. **Database Connections**: Monitor your PostgreSQL connections with:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

## Potential Optimizations Based on Results

Depending on the test results, consider these optimizations:

1. **Connection Pool Sizing**: Adjust database pool settings in your config
2. **bcrypt Cost Factor**: Review the workload factor used for bcrypt hashing
3. **Caching**: Implement caching for frequently accessed user data
4. **Database Indexes**: Ensure proper indexes exist on frequently queried columns
5. **JWT Configuration**: Adjust token expiry or signing algorithm for performance
