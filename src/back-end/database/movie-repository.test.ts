import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  findAllMovies,
  findMovieById,
  upsertMovie,
  type MovieInput,
} from './movie-repository.ts';
import { initializeSchema } from './schema.ts';

describe('movie repository', () => {
  let database: DatabaseSync;

  const createMovie = (overrides: Partial<MovieInput> = {}): MovieInput => ({
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
    runtime_minutes: 136,
    budget: 63000000,
    revenue: 463517383,
    collected_at: '2026-11-10T00:00:00.000Z',
    genres: [{ id: 28, name: 'Action' }],
    production_countries: [{ code: 'US', name: 'United States' }],
    ...overrides,
  });

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  it('creates and finds a movie with its relations', () => {
    // Arrange: prepare a movie with a genre and a production country.
    const movie = createMovie();

    // Act: save and retrieve the movie.
    upsertMovie(database, movie);
    const savedMovie = findMovieById(database, movie.id);

    // Assert: verify the movie and its relations.
    expect(savedMovie).toEqual(movie);
  });

  it('returns undefined when the movie does not exist', () => {
    // Act: search for a movie that is not stored.
    const movie = findMovieById(database, 999);

    // Assert: no movie is returned.
    expect(movie).toBeUndefined();
  });

  it('returns movies sorted by id', () => {
    // Arrange: insert movies in a different order than their ids.
    upsertMovie(database, createMovie({ id: 30, title: 'Third' }));
    upsertMovie(database, createMovie({ id: 10, title: 'First' }));
    upsertMovie(database, createMovie({ id: 20, title: 'Second' }));

    // Act: retrieve every movie.
    const movies = findAllMovies(database);

    // Assert: movies are sorted by ascending id.
    expect(movies.map((movie) => movie.id)).toEqual([10, 20, 30]);
  });

  it('updates an existing movie without creating a duplicate', () => {
    // Arrange: insert the initial movie.
    upsertMovie(database, createMovie());

    // Act: update the movie with the same id.
    upsertMovie(
      database,
      createMovie({
        title: 'The Matrix Updated',
        vote_average: 9.1,
        genres: [{ id: 18, name: 'Drama' }],
        production_countries: [{ code: 'FR', name: 'France' }],
      }),
    );

    // Assert: verify the update and the absence of duplicates.
    expect(findMovieById(database, 1)).toMatchObject({
      id: 1,
      title: 'The Matrix Updated',
      vote_average: 9.1,
      genres: [{ id: 18, name: 'Drama' }],
      production_countries: [{ code: 'FR', name: 'France' }],
    });

    const rows = database
      .prepare('SELECT COUNT(*) AS count FROM movies WHERE id = ?')
      .get(1) as { count: number };

    expect(rows.count).toBe(1);
  });

  it('returns an empty list when no movie exists', () => {
    // Act: retrieve movies from an empty database.
    const movies = findAllMovies(database);

    // Assert: the result is an empty array.
    expect(movies).toEqual([]);
  });

  it('clears relations when an updated movie has no genres or countries', () => {
    // Arrange: insert a movie with relations.
    upsertMovie(database, createMovie());

    // Act: update the movie without relations.
    upsertMovie(
      database,
      createMovie({
        genres: [],
        production_countries: [],
      }),
    );

    // Assert: old relations have been removed.
    expect(findMovieById(database, 1)).toMatchObject({
      genres: [],
      production_countries: [],
    });
  });
});
