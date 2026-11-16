import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findCountryByCode } from '../database/country-repository.ts';
import { findGenreById } from '../database/genre-repository.ts';
import { findMovieById, upsertMovie } from '../database/movie-repository.ts';
import { initializeSchema } from '../database/schema.ts';
import { syncTmdbData } from './tmdb-sync-service.ts';

describe('TMDB sync service', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  it('updates genres, countries, and movies from TMDB APIs', async () => {
    // Arrange: provide deterministic responses for each TMDB endpoint.
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 28, name: 'Action' }])),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ iso_3166_1: 'US', english_name: 'United States' }]),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            title: 'The Matrix',
            original_title: 'The Matrix',
            original_language: 'en',
            overview: 'A computer hacker discovers the truth.',
            release_date: '1999-03-31',
            popularity: 100,
            vote_average: 8.7,
            vote_count: 1000,
            poster_path: '/matrix-poster.jpg',
            backdrop_path: '/matrix-backdrop.jpg',
            runtime: 136,
            budget: 63000000,
            revenue: 463517383,
            genres: [{ id: 28, name: 'Action' }],
            production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
          }),
        ),
      );

    upsertMovie(database, {
      id: 1,
      title: 'Old title',
      original_title: 'Old title',
      original_language: 'en',
      overview: 'Old overview',
      release_date: '1999-03-31',
      popularity: 1,
      vote_average: 1,
      vote_count: 1,
      poster_path: null,
      backdrop_path: null,
      runtime_minutes: 90,
      budget: 1,
      revenue: 1,
      genres: [{ id: 18, name: 'Drama' }],
      production_countries: [{ code: 'FR', name: 'France' }],
    });

    // Act: synchronize one movie and the shared reference data.
    const result = await syncTmdbData(database, [1], {
      accessToken: 'test-token',
      fetcher,
    });

    // Assert: all API data is persisted and requests use the access token.
    expect(result).toEqual({ movies: 1, genres: 1, countries: 1 });
    expect(findGenreById(database, 28)).toEqual({ id: 28, name: 'Action' });
    expect(findCountryByCode(database, 'US')).toEqual({
      code: 'US',
      name: 'United States',
    });
    expect(findMovieById(database, 1)).toMatchObject({
      id: 1,
      title: 'The Matrix',
      runtime_minutes: 136,
      budget: 63000000,
      revenue: 463517383,
      genres: [{ id: 28, name: 'Action' }],
      production_countries: [{ code: 'US', name: 'United States' }],
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/genre/movie/list',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('stops synchronization when a TMDB request fails', async () => {
    // Arrange: make the first reference-data request fail.
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('unavailable', { status: 503 }));

    // Act and Assert: expose the API failure to the caller.
    await expect(
      syncTmdbData(database, [1], {
        accessToken: 'test-token',
        fetcher,
      }),
    ).rejects.toThrow('TMDB API request failed with status 503');
    expect(findMovieById(database, 1)).toBeUndefined();
  });
});
