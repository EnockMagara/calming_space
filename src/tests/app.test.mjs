import supertest from 'supertest';
import path from 'path';
import { fileURLToPath } from 'url';

// Set test environment
process.env.NODE_ENV = 'test';

// Import app and database functions
import { app } from '../../app.mjs';
import { connectDB, disconnectDB } from '../config/db.mjs';
import { User } from '../models/user.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const request = supertest(app);

// Connect to test database before all tests
beforeAll(async () => {
  await connectDB();
});

// Clean up test data after each test
afterEach(async () => {
  await User.deleteMany({});
});

// Disconnect from test database after all tests
afterAll(async () => {
  await disconnectDB();
});

describe('Authentication Tests', () => {
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

  test('POST /register should create a new user', async () => {
    const response = await request
      .post('/register')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    expect(response.status).toBe(302); // Redirect after successful registration
    
    // Verify user was created
    const user = await User.findOne({ username: 'testuser' });
    expect(user).toBeTruthy();
    expect(user.username).toBe('testuser');
  });

  test('POST /login should authenticate valid user', async () => {
    // Create a test user
    await request
      .post('/register')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });

    // Try to login
    const response = await request
      .post('/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    expect(response.status).toBe(302); // Redirect after successful login
    expect(response.header.location).toBe('/dashboard');
  });
});

describe('Music API Tests', () => {
  test('GET /music should require authentication', async () => {
    const response = await request.get('/music');
    expect(response.status).toBe(302); // Should redirect to login
    expect(response.header.location).toBe('/login');
  });

  test('POST /music/upload should require admin rights', async () => {
    const filePath = path.join(__dirname, '__mocks__', 'test.mp3');
    const response = await request
      .post('/music/upload')
      .attach('file', filePath);
    expect(response.status).toBe(302); // Should redirect to login for unauthenticated user
    expect(response.header.location).toBe('/login');
  });
});

describe('Error Handling', () => {
  test('Should handle invalid routes', async () => {
    const response = await request.get('/nonexistent-route');
    expect(response.status).toBe(404);
  });

  test('Should handle invalid login credentials', async () => {
    const response = await request
      .post('/login')
      .send({
        username: 'wronguser',
        password: 'wrongpassword'
      });
    expect(response.status).toBe(302); // Redirect back to login
  });
});