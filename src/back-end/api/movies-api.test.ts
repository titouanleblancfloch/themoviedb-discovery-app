import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import { tmdbAccessToken } from '../utils/config';
import * as movieQueryParams from '../utils/movie-query-params';
import { registerMoviesApi } from './movies-api';
import type {
  TmdbMovieDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

const { toSupportedMovieMock, toSupportedMovieDetailsMock } = vi.hoisted(
  () => ({
    toSupportedMovieMock: vi.fn(),
    toSupportedMovieDetailsMock: vi.fn(),
  }),
);

vi.mock('../utils/converter', () => ({
  toSupportedMovie: toSupportedMovieMock,
  toSupportedMovieDetails: toSupportedMovieDetailsMock,
}));

vi.mock('../utils/config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type RouteHandler = (
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
) => void | Promise<void>;

const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

function getHandler(path: string): RouteHandler {
  const handler = handlers.get(path);
  if (!handler) throw new Error(`No handler registered for ${path}`);
  return handler as RouteHandler;
}

function createResponse() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

function tmdbResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe('movies API', () => {
  beforeEach(() => {
    handlers.clear();
    registerMoviesApi(app);
    toSupportedMovieMock.mockReset();
    toSupportedMovieDetailsMock.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('GET /api/movies/popular', () => {
    it('returns popular movies', async () => {
      // Arrange
      const rawMovie = { id: 1 };
      const rawData = {
        page: 1,
        results: [rawMovie],
        total_pages: 2,
        total_results: 1,
      } as unknown as TmdbMoviesRawResponse;
      const supportedMovie = { id: 1, title: 'Movie' };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      toSupportedMovieMock.mockReturnValue(supportedMovie);
      const response = createResponse();
      const createMovieQueryParamsSpy = vi.spyOn(
        movieQueryParams,
        'createMovieQueryParams',
      );

      // Act
      await getHandler('/api/movies/popular')(
        { query: {} } as Request,
        response,
        vi.fn(),
      );

      // Assert
      // Assert that the createMovieQueryParams function was called with the correct query parameters
      expect(createMovieQueryParamsSpy).toHaveBeenCalledWith({});

      // Assert that the fetch function was called with the correct URL and headers
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/movie/popular?language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${tmdbAccessToken}`,
          }),
        }),
      );

      // Assert that the response contains the transformed movie data
      expect(response.json).toHaveBeenCalledWith({
        page: DEFAULT_PAGE,
        results: [supportedMovie],
        total_pages: 2,
        total_results: 1,
      });
    });

    it('returns errors for unsuccessful and rejected popular movie requests', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse({}, false, 503))
        .mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', fetchMock);
      const unsuccessfulResponse = createResponse();
      const rejectedResponse = createResponse();

      // Act
      await getHandler('/api/movies/popular')(
        { query: {} } as Request,
        unsuccessfulResponse,
        vi.fn(),
      );
      await getHandler('/api/movies/popular')(
        { query: {} } as Request,
        rejectedResponse,
        vi.fn(),
      );

      // Assert
      for (const response of [unsuccessfulResponse, rejectedResponse]) {
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to fetch popular movies',
        });
      }
    });
  });

  describe('GET /api/movies/:id', () => {
    it('returns movie details', async () => {
      // Arrange
      const rawData = { id: 42 } as unknown as TmdbMovieDetails;
      const supportedDetails = { id: 42, title: 'Movie details' };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      toSupportedMovieDetailsMock.mockReturnValue(supportedDetails);
      const response = createResponse();

      // Act
      await getHandler('/api/movies/:id')(
        { params: { id: '42' }, query: {} } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/movie/42?language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${tmdbAccessToken}`,
          }),
        }),
      );
      expect(toSupportedMovieDetailsMock).toHaveBeenCalledWith(rawData);
      expect(response.json).toHaveBeenCalledWith(supportedDetails);
    });

    it('returns errors for unsuccessful and rejected movie detail requests', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse({}, false, 404))
        .mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', fetchMock);
      const unsuccessfulResponse = createResponse();
      const rejectedResponse = createResponse();

      // Act
      await getHandler('/api/movies/:id')(
        { params: { id: '42' }, query: {} } as unknown as Request,
        unsuccessfulResponse,
        vi.fn(),
      );
      await getHandler('/api/movies/:id')(
        { params: { id: '42' }, query: {} } as unknown as Request,
        rejectedResponse,
        vi.fn(),
      );

      // Assert
      for (const response of [unsuccessfulResponse, rejectedResponse]) {
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to fetch movie with ID 42',
        });
      }
    });
  });

  describe('GET /api/discover/movies', () => {
    it('returns converted movies with default parameters', async () => {
      // Arrange: prepare a valid TMDB response and the converted movie.
      const rawMovie = { id: 1, adult: false, video: false };
      const rawData = {
        page: 1,
        results: [rawMovie],
        total_pages: 2,
        total_results: 1,
      } as unknown as TmdbMoviesRawResponse;
      const supportedMovie = { id: 1, title: 'Movie' };
      const fetchMock = vi.fn().mockResolvedValue(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      toSupportedMovieMock.mockReturnValue(supportedMovie);
      const response = createResponse();

      // Act: call Discover with the required year only.
      await getHandler('/api/discover/movies')(
        { query: { year: '2020' } } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert: send the year, defaults, and converted result without the token.
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?language=fr-FR&page=1&region=FR&primary_release_year=2020',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String),
          }),
        }),
      );
      expect(toSupportedMovieMock.mock.calls[0]?.[0]).toEqual(rawMovie);
      expect(response.json).toHaveBeenCalledWith({
        page: 1,
        results: [supportedMovie],
        total_pages: 2,
        total_results: 1,
      });
      expect(JSON.stringify(response.json.mock.calls)).not.toContain(
        'test-access-token',
      );
    });

    it('passes custom language, page, and region parameters', async () => {
      // Arrange: prepare an empty successful response and a fetch mock.
      const rawData = {
        page: 2,
        results: [],
        total_pages: 2,
        total_results: 0,
      } as unknown as TmdbMoviesRawResponse;
      const fetchMock = vi.fn().mockResolvedValue(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act: call Discover with custom optional parameters.
      await getHandler('/api/discover/movies')(
        {
          query: {
            year: '2020',
            language: 'en-US',
            page: '2',
            region: 'US',
          },
        } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert: preserve custom values and the empty paginated result.
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?language=en-US&page=2&region=US&primary_release_year=2020',
        expect.anything(),
      );
      expect(response.json).toHaveBeenCalledWith({
        page: 2,
        results: [],
        total_pages: 2,
        total_results: 0,
      });
    });

    it.each([
      ['missing year', {}],
      ['short year', { year: '202' }],
      ['long year', { year: '20200' }],
      ['non-numeric year', { year: '20ab' }],
      ['year below range', { year: '0999' }],
      ['year above range', { year: '10000' }],
      ['repeated year', { year: ['2020', '2021'] }],
      ['array-shaped year', { year: { 0: '2020' } }],
      ['nested year', { year: { foo: '2020' } }],
    ])(
      'returns HTTP 400 and skips TMDB for %s',
      async (_description, yearQuery) => {
        // Arrange: prepare an invalid year and a fetch spy.
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const response = createResponse();

        // Act: call Discover with the invalid year shape.
        await getHandler('/api/discover/movies')(
          { query: yearQuery } as unknown as Request,
          response,
          vi.fn(),
        );

        // Assert: reject the request before contacting TMDB.
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({ error: 'Invalid year' });
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it('uses defaults for empty optional parameters', async () => {
      // Arrange: prepare an empty successful response.
      const fetchMock = vi.fn().mockResolvedValue(
        tmdbResponse({
          page: 1,
          results: [],
          total_pages: 0,
          total_results: 0,
        }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act: provide empty optional values.
      await getHandler('/api/discover/movies')(
        {
          query: { year: '2020', language: '', page: '', region: '' },
        } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert: fall back to the configured defaults.
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?language=fr-FR&page=1&region=FR&primary_release_year=2020',
        expect.anything(),
      );
    });

    it('returns HTTP 500 and logs HTTP, network, and JSON errors', async () => {
      // Arrange: prepare the three TMDB failure modes.
      const invalidResponse = tmdbResponse({}, false, 503);
      const jsonMock = vi.fn().mockRejectedValueOnce(new Error('Invalid JSON'));
      const jsonErrorResponse = {
        ok: true,
        status: 200,
        json: jsonMock,
      } as unknown as Response;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(invalidResponse)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(jsonErrorResponse);
      vi.stubGlobal('fetch', fetchMock);
      const responses = [createResponse(), createResponse(), createResponse()];
      const errorSpy = vi.spyOn(console, 'error');

      // Act: invoke the route for each failure mode.
      for (const response of responses) {
        await getHandler('/api/discover/movies')(
          { query: { year: '2020' } } as unknown as Request,
          response,
          vi.fn(),
        );
      }

      // Assert: return the documented error and log every failure.
      for (const response of responses) {
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to discover movies',
        });
      }
      expect(errorSpy).toHaveBeenCalledTimes(3);
    });
  });
});
