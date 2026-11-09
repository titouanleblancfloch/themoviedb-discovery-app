import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  findAllCountries,
  findCountryByCode,
  upsertCountries,
} from './country-repository.ts';
import { initializeSchema } from './schema.ts';

describe('country repository', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  it('finds an existing country by code', () => {
    // Arrange: insert a country that can be searched.
    upsertCountries(database, [{ code: 'FR', name: 'France' }]);

    // Act: search for the inserted country.
    const country = findCountryByCode(database, 'FR');

    // Assert: return the matching country.
    expect(country).toEqual({ code: 'FR', name: 'France' });
  });

  it('returns undefined for an unknown country code', () => {
    // Act: search an empty table.
    const country = findCountryByCode(database, 'XX');

    // Assert: no country is found.
    expect(country).toBeUndefined();
  });

  it('returns an empty list when no country exists', () => {
    // Act: list countries from an empty table.
    const countries = findAllCountries(database);

    // Assert: the repository returns an empty list.
    expect(countries).toEqual([]);
  });

  it('returns countries sorted by code', () => {
    // Arrange: insert countries in a non-sorted order.
    upsertCountries(database, [
      { code: 'US', name: 'United States' },
      { code: 'FR', name: 'France' },
      { code: 'GB', name: 'United Kingdom' },
    ]);

    // Act: list all countries.
    const countries = findAllCountries(database);

    // Assert: countries are sorted by their code.
    expect(countries).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'US', name: 'United States' },
    ]);
  });

  it('inserts several countries', () => {
    // Arrange: prepare multiple countries.
    const countries = [
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ];

    // Act: insert the countries.
    upsertCountries(database, countries);

    // Assert: all countries are stored.
    expect(findAllCountries(database)).toHaveLength(2);
  });

  it('updates an existing country without creating a duplicate', () => {
    // Arrange: insert the initial country.
    upsertCountries(database, [{ code: 'FR', name: 'France' }]);

    // Act: update the existing country.
    upsertCountries(database, [{ code: 'FR', name: 'French Republic' }]);

    // Assert: the name changes and only one row remains.
    expect(findCountryByCode(database, 'FR')).toEqual({
      code: 'FR',
      name: 'French Republic',
    });
    expect(findAllCountries(database)).toHaveLength(1);
  });

  it('does not modify data with an empty iterable', () => {
    // Arrange: store a country before applying the empty iterable.
    upsertCountries(database, [{ code: 'FR', name: 'France' }]);

    // Act: apply an empty iterable.
    upsertCountries(database, []);

    // Assert: the existing data is unchanged.
    expect(findAllCountries(database)).toEqual([
      { code: 'FR', name: 'France' },
    ]);
  });

  it('accepts a Set as an iterable', () => {
    // Arrange: prepare countries in a Set.
    const countries = new Set([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);

    // Act: insert the Set.
    upsertCountries(database, countries);

    // Assert: both Set entries are stored.
    expect(findAllCountries(database)).toHaveLength(2);
  });

  it('accepts a generator as an iterable', () => {
    // Arrange: prepare a generator of countries.
    function* countries() {
      yield { code: 'FR', name: 'France' };
      yield { code: 'GB', name: 'United Kingdom' };
    }

    // Act: insert the generated countries.
    upsertCountries(database, countries());

    // Assert: generated entries are stored.
    expect(findAllCountries(database)).toHaveLength(2);
  });

  it('keeps the last name for repeated country codes', () => {
    // Act: provide the same code with two different names.
    upsertCountries(database, [
      { code: 'FR', name: 'France' },
      { code: 'FR', name: 'French Republic' },
    ]);

    // Assert: the last name wins and no duplicate is created.
    expect(findCountryByCode(database, 'FR')).toEqual({
      code: 'FR',
      name: 'French Republic',
    });
    expect(findAllCountries(database)).toHaveLength(1);
  });
});
