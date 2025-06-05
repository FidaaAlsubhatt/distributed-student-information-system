import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics to capture detailed statistics
const loginFailRate = new Rate('failed_logins');
const loginDuration = new Trend('login_duration');
const templateLoginDuration = new Trend('template_login_duration');
const adminLoginDuration = new Trend('admin_login_duration');
const studentLoginDuration = new Trend('student_login_duration');
const staffLoginDuration = new Trend('staff_login_duration');
const regularLoginDuration = new Trend('regular_login_duration');
const verifyFailRate = new Rate('failed_verifications');
const verifyDuration = new Trend('verify_duration');
const successfulLogins = new Counter('successful_logins');
const dbQueryTime = new Trend('db_query_time');

// Test configuration - stages simulate a realistic load pattern
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Warm up with 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 for 2 minutes (steady state)
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests should be below 1s
    'failed_logins': ['rate<0.1'],       // Less than 10% of logins should fail
    'failed_verifications': ['rate<0.05'], // Less than 5% of verifications should fail
  },
};

// Test users including template accounts and regular accounts
// These match the template accounts in your system
const users = [
  // Template accounts with special password handling
  { email: 'admin@university.ac.uk', password: 'password123', valid: true, type: 'template' },
  { email: 'department@university.ac.uk', password: 'password123', valid: true, type: 'template' },
  { email: 'math.Admin@university.ac.uk', password: 'password123', valid: true, type: 'template' },
  
  // Admin accounts
  { email: 'cs.admin@university.ac.uk', password: 'fidaa123', valid: true, type: 'admin' },
  { email: 'math.admin@university.ac.uk', password: 'fidaa123', valid: true, type: 'admin' },
  { email: 'central.admin@university.ac.uk', password: 'fidaa123', valid: true, type: 'admin' },
  
  // Student accounts
  { email: 'james.wilson@cs.university.ac.uk', password: '20010512', valid: true, type: 'student' },
  { email: 'emily.clarke@math.university.ac.uk', password: '20030107', valid: true, type: 'student' },
  
  // Staff accounts
  { email: 'elizabeth.johnson@cs.university.ac.uk', password: '19680324', valid: true, type: 'staff' },
  { email: 'jonathan.phillips@math.university.ac.uk', password: '19700412', valid: true, type: 'staff' },
  { email: 'student1@example.com', password: 'testpassword3', valid: true, type: 'regular' },
  
  // Invalid credentials to test error handling
  { email: 'notfound@example.com', password: 'wrongpass', valid: false, type: 'invalid' },
  { email: 'inactive@example.com', password: 'inactivepass', valid: false, type: 'invalid' },
];

// Base URL - change to your actual API URL
const baseUrl = 'http://localhost:3001/api';

export default function() {
  let token = '';
  
  group('Login Test', function() {
    // Select a random user for this iteration
    const user = randomItem(users);
    
    // Login request
    const loginUrl = `${baseUrl}/auth/login`;
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
    });
    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { userType: user.type }  // Tag the request with user type
    };
    
    const loginStart = new Date();
    const loginRes = http.post(loginUrl, payload, params);
    const loginTime = new Date() - loginStart;
    loginDuration.add(loginTime);
    
    // Add to type-specific duration metrics
    if (user.type === 'template') {
      templateLoginDuration.add(loginTime);
    } else if (user.type === 'admin') {
      adminLoginDuration.add(loginTime);
    } else if (user.type === 'student') {
      studentLoginDuration.add(loginTime);
    } else if (user.type === 'staff') {
      staffLoginDuration.add(loginTime);
    } else if (user.type === 'regular') {
      regularLoginDuration.add(loginTime);
    }
    
    // Check login result based on whether credentials should be valid
    const loginSuccess = user.valid ? 
      check(loginRes, {
        'status is 200': (r) => r.status === 200,
        'has token': (r) => {
          try {
            return JSON.parse(r.body).token !== undefined;
          } catch (e) {
            console.error(`Failed to parse response for ${user.email}:`, e);
            return false;
          }
        },
        'has user info': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.userId && body.roles && body.departmentRoles;
          } catch (e) {
            return false;
          }
        },
      }) :
      check(loginRes, {
        'invalid creds give 401/403': (r) => r.status === 401 || r.status === 403,
      });
    
    loginFailRate.add(!loginSuccess);
    
    if (loginSuccess && user.valid) {
      successfulLogins.add(1);
      try {
        token = JSON.parse(loginRes.body).token;
      } catch (e) {
        console.error('Failed to parse login response:', e);
      }
    }
    
    // Extract DB query time if it's included in response headers
    // Note: You would need to modify your backend to include this header
    if (loginRes.headers['X-DB-Query-Time']) {
      dbQueryTime.add(parseFloat(loginRes.headers['X-DB-Query-Time']));
    }
    
    sleep(1);
  });
  
  // Only test verification if we have a token
  if (token) {
    group('Token Verification Test', function() {
      const verifyUrl = `${baseUrl}/auth/verify`;
      const params = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };
      
      const verifyStart = new Date();
      const verifyRes = http.get(verifyUrl, params);
      verifyDuration.add(new Date() - verifyStart);
      
      const verifySuccess = check(verifyRes, {
        'status is 200': (r) => r.status === 200,
        'token is valid': (r) => {
          try {
            return JSON.parse(r.body).valid === true;
          } catch (e) {
            return false;
          }
        },
      });
      
      verifyFailRate.add(!verifySuccess);
      
      sleep(1);
    });
    
    // Randomly test logout to simulate real user behavior
    if (Math.random() > 0.5) { // 50% of users logout
      group('Logout Test', function() {
        const logoutUrl = `${baseUrl}/auth/logout`;
        const params = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        };
        
        const logoutRes = http.post(logoutUrl, {}, params);
        
        check(logoutRes, {
          'status is 200': (r) => r.status === 200,
          'logout successful': (r) => {
            try {
              return JSON.parse(r.body).message.includes('success');
            } catch (e) {
              return false;
            }
          },
        });
      });
    }
  }
}
