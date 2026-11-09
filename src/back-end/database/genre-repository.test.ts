import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  findAllGenres,
  findGenreById,
  upsertGenres,
} from './genre-repository.ts';
import { initializeSchema } from './schema.ts';

describe('genre repository', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  it('finds an existing genre by id', () => {
    // Arrange: insert a genre that can be searched.
    upsertGenres(database, [{ id: 28, name: 'Action' }]);

    // Act: search for the inserted genre.
    const genre = findGenreById(database, 28);

    // Assert: return the matching genre.
    expect(genre).toEqual({ id: 28, name: 'Action' });
  });

  it('returns undefined for an unknown genre id', () => {
    // Act: search an empty table.
    const genre = findGenreById(database, 999);

    // Assert: no genre is found.
    expect(genre).toBeUndefined();
  });

  it('returns an empty list when no genre exists', () => {
    // Act: list genres from an empty table.
    const genres = findAllGenres(database);

    // Assert: the repository returns an empty list.
    expect(genres).toEqual([]);
  });

  it('returns genres sorted by id', () => {
    // Arrange: insert genres in a non-sorted order.
    upsertGenres(database, [
      { id: 35, name: 'Comedy' },
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
    ]);

    // Act: list all genres.
    const genres = findAllGenres(database);

    // Assert: genres are sorted by their id.
    expect(genres).toEqual([
      { id: 12, name: 'Adventure' },
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' },
    ]);
  });

  it('inserts several genres', () => {
    // Arrange: prepare multiple genres.
    const genres = [
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
    ];

    // Act: insert the genres.
    upsertGenres(database, genres);

    // Assert: all genres are stored.
    expect(findAllGenres(database)).toHaveLength(2);
  });

  it('updates an existing genre name without creating a duplicate', () => {
    // Arrange: insert the initial genre.
    upsertGenres(database, [{ id: 28, name: 'Action' }]);

    // Act: update the existing genre.
    upsertGenres(database, [{ id: 28, name: 'Action Movies' }]);

    // Assert: the name changes and only one row remains.
    expect(findGenreById(database, 28)).toEqual({
      id: 28,
      name: 'Action Movies',
    });
    expect(findAllGenres(database)).toHaveLength(1);
  });

  it('does not modify data with an empty iterable', () => {
    // Arrange: store a genre before applying the empty iterable.
    upsertGenres(database, [{ id: 28, name: 'Action' }]);

    // Act: apply an empty iterable.
    upsertGenres(database, []);

    // Assert: the existing data is unchanged.
    expect(findAllGenres(database)).toEqual([{ id: 28, name: 'Action' }]);
  });

  it('accepts a Set as an iterable', () => {
    // Arrange: prepare genres in a Set.
    const genres = new Set([
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
    ]);

    // Act: insert the Set.
    upsertGenres(database, genres);

    // Assert: both Set entries are stored.
    expect(findAllGenres(database)).toHaveLength(2);
  });

  it('accepts a generator as an iterable', () => {
    // Arrange: prepare a generator of genres.
    function* genres() {
      yield { id: 28, name: 'Action' };
      yield { id: 35, name: 'Comedy' };
    }

    // Act: insert the generated genres.
    upsertGenres(database, genres());

    // Assert: generated entries are stored.
    expect(findAllGenres(database)).toHaveLength(2);
  });

  it('keeps the last name for repeated genre ids', () => {
    // Act: provide the same id with two different names.
    upsertGenres(database, [
      { id: 28, name: 'Action' },
      { id: 28, name: 'Action Movies' },
    ]);

    // Assert: the last name wins and no duplicate is created.
    expect(findGenreById(database, 28)).toEqual({
      id: 28,
      name: 'Action Movies',
    });
    expect(findAllGenres(database)).toHaveLength(1);
  });

  it('enforces the required genre name', () => {
    // Act and Assert: SQLite rejects a null name.
    expect(() => {
      database
        .prepare('INSERT INTO genres (id, name) VALUES (?, ?)')
        .run(28, null);
    }).toThrow();
  });
});
