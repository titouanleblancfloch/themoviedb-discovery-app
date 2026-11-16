import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import { findAllCountries } from '../database/country-repository.ts';
import { initializeSchema } from '../database/schema.ts';
import {
  importCountries,
  parseCountriesCsv,
} from './country-import-service.ts';

describe('country import service', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  it('parses supported CSV formats and imports countries', () => {
    // Arrange: use BOM, CRLF, reordered case-insensitive headers, quoting and spaces.
    const content =
      '\uFEFFNAME,Code\r\n"United, States", US\r\nUnited Kingdom, GB\r\n';

    // Act: parse and import the countries.
    const countries = parseCountriesCsv(content);
    const imported = importCountries(database, countries);

    // Assert: values are normalized and persisted without duplicates.
    expect(countries).toEqual([
      { code: 'US', name: 'United, States' },
      { code: 'GB', name: 'United Kingdom' },
    ]);
    expect(imported).toBe(2);
    expect(findAllCountries(database)).toEqual([
      { code: 'GB', name: 'United Kingdom' },
      { code: 'US', name: 'United, States' },
    ]);
  });

  it('returns no countries for an empty document or headers only', () => {
    // Act and Assert: empty inputs produce an empty import.
    expect(parseCountriesCsv('')).toEqual([]);
    expect(parseCountriesCsv('code,name\n')).toEqual([]);
    expect(parseCountriesCsv('name,CODE\n')).toEqual([]);
  });

  it('rejects invalid headers, values, and CSV syntax', () => {
    // Act and Assert: invalid documents expose explicit errors.
    expect(() => parseCountriesCsv('code,other\nFR,France')).toThrow(
      'expected code and name',
    );
    expect(() => parseCountriesCsv('code,name\nFRA,France')).toThrow(
      'expected two uppercase letters',
    );
    expect(() => parseCountriesCsv('code,name\nFR,France,Extra')).toThrow(
      'Invalid countries CSV',
    );
    expect(() => parseCountriesCsv('code,name\nFR,')).toThrow('name is empty');
    expect(() => parseCountriesCsv('code,name\n"FR,France')).toThrow(
      'Invalid countries CSV',
    );
  });

  it('rolls back all rows when an import fails', () => {
    // Arrange: make the second country violate the database schema.
    const countries = [
      { code: 'FR', name: 'France' },
      { code: 'US', name: null as unknown as string },
    ];

    // Act and Assert: failed imports leave no partial writes.
    expect(() => importCountries(database, countries)).toThrow();
    expect(findAllCountries(database)).toEqual([]);
  });
});
