const generateTokens = require('../../utils/generateToken');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Utils Unit Tests', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh tokens and set cookies', () => {
      const res = {
        cookie: jest.fn()
      };
      
      process.env.JWT_ACCESS_SECRET = 'access_secret';
      process.env.JWT_REFRESH_SECRET = 'refresh_secret';
      process.env.NODE_ENV = 'development';

      jwt.sign.mockImplementation((payload, secret, options) => {
        if (secret === 'access_secret') return 'mockAccessToken';
        if (secret === 'refresh_secret') return 'mockRefreshToken';
      });

      generateTokens(res, 'user123');

      expect(jwt.sign).toHaveBeenCalledWith({ userId: 'user123' }, 'access_secret', { expiresIn: '15m' });
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 'user123' }, 'refresh_secret', { expiresIn: '7d' });

      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mockAccessToken', expect.objectContaining({
        httpOnly: true,
        secure: false, // development
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      }));

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mockRefreshToken', expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      }));
    });
  });
});
