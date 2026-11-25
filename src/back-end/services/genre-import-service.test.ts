import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findAllGenres } from '../database/genre-repository.ts';
import { initializeSchema } from '../database/schema.ts';
import { importGenres, parseGenresCsv } from './genre-import-service.ts';

describe('genre import service', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  it('parses supported CSV formats and imports genres', () => {
    // Arrange: use BOM, CRLF, reordered case-insensitive headers, quoting,
    // escaped quotes, spaces and blank lines.
    const content =
      '﻿NAME,Id\r\n"Action, Adventure", 28\r\n\r\n"Science ""Fiction""",878\r\n';

    // Act: parse and import the genres.
    const genres = parseGenresCsv(content);
    const imported = importGenres(database, genres);

    // Assert: values are normalized and persisted.
    expect(genres).toEqual([
      { id: 28, name: 'Action, Adventure' },
      { id: 878, name: 'Science "Fiction"' },
    ]);
    expect(imported).toBe(2);
    expect(findAllGenres(database)).toEqual([
      { id: 28, name: 'Action, Adventure' },
      { id: 878, name: 'Science "Fiction"' },
    ]);
  });

  it('updates existing genres without creating duplicates', () => {
    // Arrange: import a first version of the genre.
    importGenres(database, parseGenresCsv('id,name\n28,Action'));

    // Act: import the same id with a new name.
    importGenres(database, parseGenresCsv('id,name\n28,Action Movies'));

    // Assert: a single row holds the latest name.
    expect(findAllGenres(database)).toEqual([
      { id: 28, name: 'Action Movies' },
    ]);
  });

  it('returns no genres for an empty document or headers only', () => {
    // Act and Assert: empty inputs produce an empty import.
    expect(parseGenresCsv('')).toEqual([]);
    expect(parseGenresCsv('id,name\n')).toEqual([]);
    expect(parseGenresCsv('NAME,ID\n\n')).toEqual([]);
  });

  it('rejects invalid headers and rows', () => {
    // Act and Assert: invalid structures expose explicit errors.
    expect(() => parseGenresCsv('id,other\n28,Action')).toThrow(
      'expected id and name',
    );
    expect(() => parseGenresCsv('id,name,extra\n28,Action,x')).toThrow(
      'expected id and name',
    );
    expect(() => parseGenresCsv('id,name\n28,Action,Extra')).toThrow(
      'Invalid genres CSV row 2',
    );
    expect(() => parseGenresCsv('id,name\n28,')).toThrow('name is empty');
  });

  it('rejects ids that are not positive safe integers', () => {
    // Arrange: ids that are negative, zero, decimal, textual or too large.
    const invalidIds = ['0', '-1', '1.5', 'abc', '', '9007199254740993'];

    // Act and Assert: each invalid id is rejected with an explicit message.
    for (const id of invalidIds) {
      expect(() => parseGenresCsv(`id,name\n${id},Action`)).toThrow(
        'expected a positive integer',
      );
    }
  });

  it('rejects malformed quotes', () => {
    // Act and Assert: CSV syntax errors are wrapped with context.
    expect(() => parseGenresCsv('id,name\n28,"Action')).toThrow(
      'Invalid genres CSV',
    );
  });

  it('rolls back all rows when an import fails', () => {
    // Arrange: make the second genre violate the database schema.
    const genres = [
      { id: 28, name: 'Action' },
      { id: 35, name: null as unknown as string },
    ];

    // Act and Assert: failed imports leave no partial writes.
    expect(() => importGenres(database, genres)).toThrow();
    expect(findAllGenres(database)).toEqual([]);
  });
});
