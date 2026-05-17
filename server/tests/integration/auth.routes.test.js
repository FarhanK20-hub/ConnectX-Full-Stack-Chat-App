const request = require('supertest');
const app = require('../../app');

describe('Auth Routes Integration Tests', () => {
  const validUser = {
    name: 'Integration User',
    email: 'int@test.com',
    password: 'password123'
  };

  describe('POST /api/auth/register', () => {
    it('should create user and return 201 with cookie', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe(validUser.name);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with tokens on valid credentials', async () => {
      // Register first within the same test
      await request(app).post('/api/auth/register').send(validUser);

      const res = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password
      });
      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 on wrong password', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: 'wrongpassword'
      });
      expect(res.status).toBe(401);
    });

    it('should return 401 for unregistered email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@test.com',
        password: 'password123'
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 200 and new tokens if valid refresh token cookie exists', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(validUser);
      const cookies = registerRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
    });

    it('should return 401 if no cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookies and return 200', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(validUser);
      const cookies = registerRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 200 and profile if authenticated', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(validUser);
      const cookies = registerRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(validUser.email);
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
