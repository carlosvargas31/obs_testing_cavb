import jwt_decode from 'jwt-decode';
import {
  setAuthToken,
  removeAuthToken,
  isTokenActive,
  getAccessToken,
  getCurrentUser,
  WrongCredentialsException,
  logout,
} from '../auth';
import { tokenKey } from '../../constants/config';
import { User } from '../../model/user';

jest.mock('jwt-decode');

describe('Auth Utils', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('setAuthToken()', () => {
    it('should store token with correct structure in localStorage', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const accessToken = 'test-access-token';
      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 3600,
        exp: Math.floor(now / 1000) + 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);

      setAuthToken(accessToken);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        tokenKey,
        expect.stringContaining(accessToken)
      );

      const storedToken = JSON.parse(mockLocalStorage[tokenKey]);
      expect(storedToken.accessToken).toBe(accessToken);
      expect(storedToken.notBeforeTimestampInMillis).toBe(mockPayload.iat * 1000);
      expect(storedToken.expirationTimestampInMillis).toBe(mockPayload.exp * 1000);
    });

    it('should overwrite existing token', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const firstToken = 'first-token';
      const secondToken = 'second-token';

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 3600,
        exp: Math.floor(now / 1000) + 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);

      setAuthToken(firstToken);
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);

      setAuthToken(secondToken);
      expect(localStorage.setItem).toHaveBeenCalledTimes(2);

      const storedToken = JSON.parse(mockLocalStorage[tokenKey]);
      expect(storedToken.accessToken).toBe(secondToken);
    });

    it('should handle invalid JWT token', () => {
      const accessToken = 'invalid-token';
      (jwt_decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => setAuthToken(accessToken)).toThrow('Invalid token');
    });
  });

  describe('removeAuthToken()', () => {
    it('should remove token from localStorage', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 3600,
        exp: Math.floor(now / 1000) + 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('test-token');

      removeAuthToken();

      expect(localStorage.removeItem).toHaveBeenCalledWith(tokenKey);
      expect(mockLocalStorage[tokenKey]).toBeUndefined();
    });

    it('should not throw error when localStorage is empty', () => {
      expect(() => removeAuthToken()).not.toThrow();
      expect(localStorage.removeItem).toHaveBeenCalledWith(tokenKey);
    });

    it('should allow multiple removes without error', () => {
      removeAuthToken();
      removeAuthToken();
      removeAuthToken();

      expect(localStorage.removeItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('isTokenActive()', () => {
    it('should return true for valid, non-expired token', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 3600, // 1 hour ago
        exp: Math.floor(now / 1000) + 3600, // 1 hour from now
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('test-token');

      expect(isTokenActive()).toBe(true);
    });

    it('should return false for expired token', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 7200,
        exp: Math.floor(now / 1000) - 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('test-token');

      expect(isTokenActive()).toBe(false);
    });

    it('should return false when token not yet valid (iat in future)', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) + 3600,
        exp: Math.floor(now / 1000) + 7200,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('test-token');

      expect(isTokenActive()).toBe(false);
    });

    it('should return false when no token exists', () => {
      expect(isTokenActive()).toBe(false);
    });

    it('should return true at token expiration boundary (1 second before expiry)', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 3600,
        exp: Math.floor(now / 1000) + 1,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('test-token');

      expect(isTokenActive()).toBe(true);
    });
  });

  describe('getAccessToken()', () => {
    it('should return access token when token exists', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const accessToken = 'my-access-token-123';
      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 3600,
        exp: Math.floor(now / 1000) + 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken(accessToken);

      expect(getAccessToken()).toBe(accessToken);
    });

    it('should return empty string when no token exists', () => {
      expect(getAccessToken()).toBe('');
    });

    it('should return empty string when localStorage is empty', () => {
      mockLocalStorage = {};
      expect(getAccessToken()).toBe('');
    });

    it('should handle malformed token JSON in localStorage', () => {
      mockLocalStorage[tokenKey] = 'invalid-json{';
      expect(() => getAccessToken()).toThrow();
    });
  });

  describe('getCurrentUser()', () => {
    it('should return user object when token is valid and active', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 3600,
        exp: Math.floor(now / 1000) + 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('test-token');

      const user = getCurrentUser();

      expect(user).toEqual({
        _id: 'user-123',
        email: 'test@example.com',
        active: true,
      });
    });

    it('should return undefined when no token exists', () => {
      expect(getCurrentUser()).toBeUndefined();
    });

    it('should return undefined and remove token when token is expired', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) - 7200,
        exp: Math.floor(now / 1000) - 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('expired-token');

      expect(mockLocalStorage[tokenKey]).toBeDefined();

      const user = getCurrentUser();

      expect(user).toBeUndefined();
      expect(mockLocalStorage[tokenKey]).toBeUndefined();
    });

    it('should return undefined and remove token when token not yet valid', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(now / 1000) + 3600,
        exp: Math.floor(now / 1000) + 7200,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('future-token');

      const user = getCurrentUser();

      expect(user).toBeUndefined();
      expect(mockLocalStorage[tokenKey]).toBeUndefined();
    });

    it('should correctly decode JWT payload for user data', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-abc-def-123',
        email: 'john.doe@example.com',
        iat: Math.floor(now / 1000) - 3600,
        exp: Math.floor(now / 1000) + 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('test-token');

      const user = getCurrentUser();

      expect(user?._id).toBe('user-abc-def-123');
      expect(user?.email).toBe('john.doe@example.com');
      expect(user?.active).toBe(true);
      expect(jwt_decode).toHaveBeenCalledWith('test-token');
    });

    it('should handle edge case with special characters in email', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const mockPayload = {
        _id: 'user-123',
        email: 'test+special@example.co.uk',
        iat: Math.floor(now / 1000) - 3600,
        exp: Math.floor(now / 1000) + 3600,
      };

      (jwt_decode as jest.Mock).mockReturnValue(mockPayload);
      setAuthToken('test-token');

      const user = getCurrentUser();

      expect(user?.email).toBe('test+special@example.co.uk');
    });
  });
});
