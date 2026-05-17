const { registerUser, loginUser, logoutUser, refreshToken } = require('../../controllers/authController');
const User = require('../../models/User');
const generateTokens = require('../../utils/generateToken');
const jwt = require('jsonwebtoken');

jest.mock('../../models/User');
jest.mock('../../utils/generateToken');
jest.mock('jsonwebtoken');

describe('Auth Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      cookies: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should return 400 if user already exists', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: 'password123' };
      User.findOne.mockResolvedValue(true);

      await registerUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 201 with user object on success', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: 'password123' };
      User.findOne.mockResolvedValue(false);
      const mockUser = { _id: '123', name: 'Test', email: 'test@test.com', avatar: '' };
      User.create.mockResolvedValue(mockUser);

      await registerUser(req, res, next);

      expect(User.create).toHaveBeenCalledWith(req.body);
      expect(generateTokens).toHaveBeenCalledWith(res, '123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 400 if user creation fails (invalid data)', async () => {
      req.body = { name: 'Test' }; // Missing email/password
      User.findOne.mockResolvedValue(false);
      User.create.mockResolvedValue(null);

      await registerUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('loginUser', () => {
    it('should return 401 if user not found', async () => {
      req.body = { email: 'wrong@test.com', password: 'password123' };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 401 if password incorrect', async () => {
      req.body = { email: 'test@test.com', password: 'wrongpassword' };
      const mockUser = {
        matchPassword: jest.fn().mockResolvedValue(false),
        select: jest.fn().mockReturnThis()
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 200 with user object on valid credentials', async () => {
      req.body = { email: 'test@test.com', password: 'password123' };
      const mockUser = {
        _id: '123',
        name: 'Test',
        email: 'test@test.com',
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await loginUser(req, res, next);

      expect(generateTokens).toHaveBeenCalledWith(res, '123');
      expect(mockUser.isOnline).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        _id: '123',
        name: 'Test',
        email: 'test@test.com',
        avatar: undefined
      });
    });
  });

  describe('refreshToken', () => {
    it('should return 401 if no refresh token cookie', async () => {
      req.cookies = {}; // No refreshToken

      await refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 401 if refresh token is invalid/expired', async () => {
      req.cookies = { refreshToken: 'invalidToken' };
      jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

      await refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return new accessToken if refresh token is valid', async () => {
      req.cookies = { refreshToken: 'validToken' };
      jwt.verify.mockReturnValue({ userId: '123' });
      const mockUser = { _id: '123' };
      User.findById.mockResolvedValue(mockUser);

      await refreshToken(req, res, next);

      expect(generateTokens).toHaveBeenCalledWith(res, '123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token refreshed' });
    });
  });

  describe('logoutUser', () => {
    it('should clear the refreshToken and accessToken cookies', async () => {
      req.user = { _id: '123' };
      const mockUser = {
        _id: '123',
        save: jest.fn().mockResolvedValue(true)
      };
      User.findById.mockResolvedValue(mockUser);

      await logoutUser(req, res, next);

      expect(mockUser.isOnline).toBe(false);
      expect(mockUser.lastSeen).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();

      expect(res.cookie).toHaveBeenCalledWith('accessToken', '', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', '', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });
});
