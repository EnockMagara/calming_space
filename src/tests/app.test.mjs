import supertest from 'supertest';

// Set test environment
process.env.NODE_ENV = 'test';

// Import app and database functions
import { app } from '../../app.mjs';
import { connectDB, disconnectDB } from '../config/db.mjs';

const request = supertest(app);

// Connect to test database before all tests
beforeAll(async () => {
  await connectDB();
});

// Disconnect from test database after all tests
afterAll(async () => {
  await disconnectDB();
});

describe('Application Tests', () => {
  test('GET / should redirect to /dashboard', async () => {
    const response = await request.get('/');
    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/dashboard');
  });

  test('GET /login should return 200 for unauthenticated users', async () => {
    const response = await request.get('/login');
    expect(response.status).toBe(200);
  });

  test('GET /register should return 200 for unauthenticated users', async () => {
    const response = await request.get('/register');
    expect(response.status).toBe(200);
  });
}); 