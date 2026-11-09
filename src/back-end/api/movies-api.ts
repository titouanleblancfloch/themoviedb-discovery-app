import type { Express } from 'express';
import express from 'express';
import { createMovieQueryParams } from '../utils/movie-query-params';
import { toSupportedMovie, toSupportedMovieDetails } from '../utils/converter';
import { tmdbAccessToken } from '../utils/config';
import type {
  MovieDetails,
  MoviesApiResponse,
  TmdbMovieDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

export { createMovieQueryParams } from '../utils/movie-query-params';

/**
 * Registers the movies API routes (popular movies, discovery, and movie details).
 * @param app - The Express application instance to register the movies API routes on.
 */
export function registerMoviesApi(app: Express): void {
  app.get(
    '/api/movies/popular',
    async (_req: express.Request, res: express.Response) => {
      try {
        const queryParams = createMovieQueryParams(_req.query);
        console.log('Query Params:', queryParams.toString());

        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?${queryParams.toString()}`,
          {
            headers: {
              Authorization: 'Bearer ' + tmdbAccessToken,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        const rawData = (await response.json()) as TmdbMoviesRawResponse;
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };

        res.json(data);
      } catch (error) {
        console.error('Error fetching popular movies:', error);
        res.status(500).json({ error: 'Failed to fetch popular movies' });
      }
    },
  );

  app.get(
    '/api/discover/movies',
    async (req: express.Request, res: express.Response) => {
      const { year } = req.query;

      if (
        typeof year !== 'string' ||
        !/^\d{4}$/.test(year) ||
        Number(year) < 1000 ||
        Number(year) > 9999
      ) {
        res.status(400).json({ error: 'Invalid year' });
        return;
      }

      try {
        const queryParams = createMovieQueryParams({
          ...req.query,
          language:
            typeof req.query.language === 'string'
              ? req.query.language
              : undefined,
          page: typeof req.query.page === 'string' ? req.query.page : undefined,
          region:
            typeof req.query.region === 'string' ? req.query.region : undefined,
        });
        queryParams.set('primary_release_year', year);

        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`,
          {
            headers: {
              Authorization: 'Bearer ' + tmdbAccessToken,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        const rawData = (await response.json()) as TmdbMoviesRawResponse;
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };

        res.json(data);
      } catch (error) {
        console.error('Error discovering movies:', error);
        res.status(500).json({ error: 'Failed to discover movies' });
      }
    },
  );

  app.get(
    '/api/movies/:id',
    async (_req: express.Request, res: express.Response) => {
      const movieId = _req.params.id;
      const queryParams = createMovieQueryParams(_req.query);
      console.log('Query Params:', queryParams.toString());

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?${queryParams.toString()}`,
          {
            headers: {
              Authorization: 'Bearer ' + tmdbAccessToken,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        const rawData = (await response.json()) as TmdbMovieDetails;
        const data: MovieDetails = toSupportedMovieDetails(rawData);
        res.json(data);
      } catch (error) {
        console.error(`Error fetching movie with ID ${movieId}:`, error);
        res
          .status(500)
          .json({ error: `Failed to fetch movie with ID ${movieId}` });
      }
    },
  );
}
