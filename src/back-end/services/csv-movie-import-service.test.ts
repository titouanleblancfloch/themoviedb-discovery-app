import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { upsertGenres } from '../database/genre-repository.ts';
import { findMovieById, upsertMovie } from '../database/movie-repository.ts';
import { initializeSchema } from '../database/schema.ts';
import {
  importMoviesFromCsv,
  importMoviesFromCsvFile,
} from './csv-movie-import-service.ts';

const csv = `id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime,budget,revenue,genres,production_countries
1,"The Matrix","The Matrix",en,"A hacker, Neo, learns the truth.",1999-03-31,100,8.7,1000,/poster.jpg,/backdrop.jpg,136,63000000,463517383,"[28]","[{""iso_3166_1"":""US"",""name"":""United States""}]"`;

describe('CSV movie import service', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON');
    initializeSchema(database);
    upsertGenres(database, [{ id: 28, name: 'Action' }]);
  });

  afterEach(() => {
    database.close();
  });

  it('imports a movie and updates an existing movie', () => {
    // Arrange: store an older version of the movie before importing the CSV.
    upsertMovie(database, {
      id: 1,
      title: 'Old title',
      original_title: 'Old title',
      original_language: 'en',
      overview: 'Old overview',
      release_date: null,
      popularity: 1,
      vote_average: 1,
      vote_count: 1,
      poster_path: null,
      backdrop_path: null,
      runtime_minutes: 90,
      budget: null,
      revenue: null,
      genres: [],
      production_countries: [],
    });

    // Act: import the CSV row.
    const importedCount = importMoviesFromCsv(database, csv);

    // Assert: the row is imported and the existing movie is updated in place.
    expect(importedCount).toBe(1);
    expect(findMovieById(database, 1)).toMatchObject({
      id: 1,
      title: 'The Matrix',
      overview: 'A hacker, Neo, learns the truth.',
      runtime_minutes: 136,
      genres: [{ id: 28, name: 'Action' }],
      production_countries: [{ code: 'US', name: 'United States' }],
    });

    // Act and Assert: support CSV files using Windows line endings.
    expect(importMoviesFromCsv(database, csv.replaceAll('\n', '\r\n'))).toBe(1);
  });

  it('rejects malformed rows before writing any movie', () => {
    // Arrange: make the only CSV row reference an unknown genre.
    const invalidCsv = csv.replace('[28]', '[999]');

    // Act and Assert: report the invalid reference and preserve the database.
    expect(() => importMoviesFromCsv(database, invalidCsv)).toThrow(
      'CSV row 2 references unknown genre 999',
    );
    expect(findMovieById(database, 1)).toBeUndefined();
  });

  it('imports a CSV file and accepts empty optional values', async () => {
    // Arrange: write a row with empty optional fields to a temporary file.
    const directory = mkdtempSync(join(tmpdir(), 'movie-import-'));
    const filePath = join(directory, 'movies.csv');
    const emptyOptionals = `id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime,budget,revenue,genres,production_countries
2,Title,Title,en,,,,,,,,,,,[],[]`;
    writeFileSync(filePath, emptyOptionals);

    // Act: import the file.
    const importedCount = await importMoviesFromCsvFile(database, filePath);

    // Assert: empty optional values become null and the row is persisted.
    expect(importedCount).toBe(1);
    expect(findMovieById(database, 2)).toMatchObject({
      id: 2,
      release_date: null,
      popularity: null,
      runtime_minutes: null,
      genres: [],
      production_countries: [],
    });
  });

  it('rejects invalid CSV structure and values', () => {
    // Arrange: prepare representative malformed CSV inputs.
    const invalidInputs = [
      ['', ''],
      [csv.replace('id,title', 'invalid,title'), 'CSV header must contain'],
      [csv + '\n1', 'CSV row 3 contains 1 columns'],
      ['"unterminated', 'CSV contains an unterminated quoted field'],
      [csv.replace('1,"The Matrix"', 'invalid,"The Matrix"'), 'invalid id'],
      [csv.replace('"[28]"', '"invalid"'), 'invalid JSON in genres'],
      [csv.replace('"[28]"', '"[""28""]"'), 'invalid genre IDs'],
      [
        csv.replace(
          '"[{""iso_3166_1"":""US"",""name"":""United States""}]"',
          '"invalid"',
        ),
        'invalid JSON in production_countries',
      ],
      [
        csv.replace(
          '"[{""iso_3166_1"":""US"",""name"":""United States""}]"',
          '"[""US""]"',
        ),
        'invalid production countries',
      ],
    ] as const;

    // Act and Assert: each malformed input is rejected with a useful error.
    for (const [content, message] of invalidInputs) {
      if (content === '') {
        expect(importMoviesFromCsv(database, content)).toBe(0);
      } else {
        expect(() => importMoviesFromCsv(database, content)).toThrow(message);
      }
    }
  });
});
