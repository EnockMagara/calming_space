import request from 'supertest';
import express from 'express';
import { app } from '../../app.mjs';

describe('Application Tests', () => {
  test('GET / should redirect to /dashboard', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/dashboard');
  });

  test('GET /login should return 200 for unauthenticated users', async () => {
    const response = await request(app).get('/login');
    expect(response.status).toBe(200);
  });

  test('GET /register should return 200 for unauthenticated users', async () => {
    const response = await request(app).get('/register');
    expect(response.status).toBe(200);
  });
}); 