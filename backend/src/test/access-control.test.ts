import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import dotenv from 'dotenv';
import path from 'path';

interface LoginResult {
  token: string;
}

interface RoleCase {
  label: string;
  credentials: {
    email: string;
    password: string;
  };
  allowedPaths: string[];
  forbiddenPaths: string[];
}

const roleCases: RoleCase[] = [
  {
    label: 'central admin',
    credentials: {
      email: 'central.admin@university.ac.uk',
      password: 'fidaa123',
    },
    allowedPaths: ['/api/admin', '/api/central/student_directory', '/api/users', '/api/departments'],
    forbiddenPaths: ['/api/department/students', '/api/staff/modules', '/api/student/profile'],
  },
  {
    label: 'department admin',
    credentials: {
      email: 'cs.admin@university.ac.uk',
      password: 'fidaa123',
    },
    allowedPaths: ['/api/department/students'],
    forbiddenPaths: ['/api/admin', '/api/central/student_directory', '/api/users'],
  },
  {
    label: 'academic staff',
    credentials: {
      email: 'jonathan.phillips@math.university.ac.uk',
      password: '19700412',
    },
    allowedPaths: ['/api/staff/modules'],
    forbiddenPaths: ['/api/admin', '/api/department/students', '/api/student/profile'],
  },
  {
    label: 'student',
    credentials: {
      email: 'emily.clarke@math.university.ac.uk',
      password: '20030107',
    },
    allowedPaths: ['/api/student/profile'],
    forbiddenPaths: ['/api/admin', '/api/department/students', '/api/staff/modules'],
  },
];

let baseUrl = '';
let server: Server;

async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(response.status, 200, `login failed for ${email}`);
  return response.json() as Promise<LoginResult>;
}

async function getWithToken(pathname: string, token?: string) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return fetch(`${baseUrl}${pathname}`, { headers });
}

describe('role access control', () => {
  before(async () => {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    process.env.DISABLE_SCHEDULER = 'true';

    const { default: app } = await import('../app');

    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => {
      server.once('listening', () => resolve());
    });

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  test('rejects unauthenticated access to protected routes', async () => {
    const response = await getWithToken('/api/admin');
    assert.equal(response.status, 401);
  });

  for (const roleCase of roleCases) {
    test(`allows the ${roleCase.label} routes`, async () => {
      const { token } = await login(roleCase.credentials.email, roleCase.credentials.password);

      for (const pathname of roleCase.allowedPaths) {
        const response = await getWithToken(pathname, token);
        assert.equal(
          response.status,
          200,
          `${roleCase.label} should access ${pathname} but got ${response.status}`
        );
      }
    });

    test(`blocks the ${roleCase.label} from other routes`, async () => {
      const { token } = await login(roleCase.credentials.email, roleCase.credentials.password);

      for (const pathname of roleCase.forbiddenPaths) {
        const response = await getWithToken(pathname, token);
        assert.equal(
          response.status,
          403,
          `${roleCase.label} should be blocked from ${pathname} but got ${response.status}`
        );
      }
    });
  }
});
