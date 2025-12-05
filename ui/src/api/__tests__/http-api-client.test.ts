import HttpApiClient from '../http-api-client';
import { Project } from '../../model/project';
import * as authUtils from '../../utils/auth';
import { BadRequest, NotFound, GenericError } from '../api-client';

// Mock auth utilities
jest.mock('../../utils/auth', () => ({
  getAccessToken: jest.fn(),
  removeAuthToken: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('HttpApiClient', () => {
  const baseUrl = 'https://api.example.com';
  let client: HttpApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new HttpApiClient(baseUrl);
  });

  describe('constructor', () => {
    test('stores baseUrl correctly', () => {
      const testUrl = 'https://api.test.com';
      const testClient = new HttpApiClient(testUrl);
      expect(testClient.baseUrl).toBe(testUrl);
    });
  });

  describe('token method', () => {
    test('sends POST request to /auth/login with email and password', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ access_token: 'token123' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await client.token('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams)
        })
      );
    });

    test('throws error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad request')
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      let errorThrown = false;
      try {
        await client.token('test@example.com', 'password');
      } catch (e) {
        errorThrown = true;
      }
      expect(errorThrown).toBe(true);
    });
  });

  describe('getAboutMe method', () => {
    test('fetches AboutMe data successfully', async () => {
      const mockAboutMe = {
        _id: 'aboutme-1',
        name: 'John Doe',
        job: 'Developer'
      };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockAboutMe)
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await client.getAboutMe();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/aboutme/',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockAboutMe);
    });

    test('throws error on failed response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not found')
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      let errorThrown = false;
      try {
        await client.getAboutMe();
      } catch (e) {
        errorThrown = true;
      }
      expect(errorThrown).toBe(true);
    });
  });

  describe('getProjects method', () => {
    test('fetches projects list successfully', async () => {
      const mockProjects = [
        {
          _id: 'proj-1',
          title: 'Project 1',
          description: 'Desc 1',
          link: 'https://link.com',
          version: 'v1.0',
          tag: 'React',
          timestamp: 123456
        }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockProjects)
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await client.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/projects/',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockProjects);
    });
  });

  describe('getDashboardInfo method', () => {
    test('combines aboutMe and projects data', async () => {
      const mockAboutMe = { _id: 'about-1', name: 'John Doe' };
      const mockProjects = [
        { _id: 'proj-1', title: 'Project 1', timestamp: 123456, description: 'Desc', link: 'link', version: 'v1', tag: 'tag' }
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockAboutMe)
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockProjects)
        } as any);

      const result = await client.getDashboardInfo();

      expect(result.aboutMe).toEqual(mockAboutMe);
      expect(result.projects).toEqual(mockProjects);
    });
  });
});
