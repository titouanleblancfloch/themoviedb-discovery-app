import { DatabaseSync } from 'node:sqlite';
import type { Country } from '../types/MoviesTypes.ts';

export function findCountryByCode(
  database: DatabaseSync,
  code: string,
): Country | undefined {
  return database
    .prepare('SELECT code, name FROM countries WHERE code = ?')
    .get(code) as Country | undefined;
}

export function findAllCountries(database: DatabaseSync): Country[] {
  return database
    .prepare('SELECT code, name FROM countries ORDER BY code ASC')
    .all() as Country[];
}

export function upsertCountries(
  database: DatabaseSync,
  countries: Iterable<Country>,
): void {
  const statement = database.prepare(`
    INSERT INTO countries (code, name)
    VALUES (?, ?)
    ON CONFLICT(code) DO UPDATE SET name = excluded.name
  `);

  for (const country of countries) {
    statement.run(country.code, country.name);
  }
}
