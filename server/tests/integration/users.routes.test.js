const request = require('supertest');
const app = require('../../app');

describe('Users Routes Integration Tests', () => {
  let cookiesA, cookiesB, userA, userB;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice Wonderland', email: 'alice@test.com', password: 'password123'
    });
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob Builder', email: 'bob@test.com', password: 'password123'
    });

    userA = resA.body;
    userB = resB.body;
    cookiesA = resA.headers['set-cookie'];
    cookiesB = resB.headers['set-cookie'];
  });

  describe('GET /api/users/search?q=', () => {
    it('should return matching users by name', async () => {
      const res = await request(app)
        .get('/api/users/search?q=Bob')
        .set('Cookie', cookiesA);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Bob Builder');
    });

    it('should return matching users by email', async () => {
      const res = await request(app)
        .get('/api/users/search?q=bob@test')
        .set('Cookie', cookiesA);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].email).toBe('bob@test.com');
    });

    it('should exclude the searching user from results', async () => {
      const res = await request(app)
        .get('/api/users/search?q=Alice')
        .set('Cookie', cookiesA);

      expect(res.status).toBe(200);
      const ids = res.body.map(u => u._id.toString());
      expect(ids).not.toContain(userA._id.toString());
    });

    it('should return empty array for no matches', async () => {
      const res = await request(app)
        .get('/api/users/search?q=NonExistentPerson')
        .set('Cookie', cookiesA);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/users/search?q=Bob');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/users/profile', () => {
    it('should update name and bio', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Cookie', cookiesA)
        .send({ name: 'Alice Updated', bio: 'Hello world' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Alice Updated');
      expect(res.body.bio).toBe('Hello world');
    });

    it('should update avatar URL', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Cookie', cookiesA)
        .send({ avatar: 'https://example.com/avatar.png' });

      expect(res.status).toBe(200);
      expect(res.body.avatar).toBe('https://example.com/avatar.png');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .send({ name: 'Hacker' });

      expect(res.status).toBe(401);
    });
  });
});
