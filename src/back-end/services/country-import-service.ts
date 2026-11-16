import { parse } from 'csv-parse/sync';
import type { DatabaseSync } from 'node:sqlite';
import { upsertCountries } from '../database/country-repository.ts';
import type { Country } from '../types/MoviesTypes.ts';

export function parseCountriesCsv(content: string): Country[] {
  let rows: string[][];
  try {
    rows = parse(content, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    }) as string[][];
  } catch (error) {
    throw new Error(`Invalid countries CSV: ${String(error)}`);
  }

  if (rows.length === 0) {
    return [];
  }

  const header = rows[0].map((column) => column.toLowerCase());
  if (
    header.length !== 2 ||
    !header.includes('code') ||
    !header.includes('name')
  ) {
    throw new Error('Invalid countries CSV header: expected code and name');
  }

  const codeIndex = header.indexOf('code');
  const nameIndex = header.indexOf('name');

  return rows.slice(1).map((row, index) => {
    if (row.length !== 2) {
      throw new Error(
        `Invalid countries CSV row ${index + 2}: expected code and name`,
      );
    }

    const code = row[codeIndex];
    const name = row[nameIndex];
    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error(
        `Invalid country code on CSV row ${index + 2}: expected two uppercase letters`,
      );
    }
    if (!name) {
      throw new Error(
        `Invalid country name on CSV row ${index + 2}: name is empty`,
      );
    }

    return { code, name };
  });
}

export function importCountries(
  database: DatabaseSync,
  countries: Country[],
): number {
  database.exec('BEGIN TRANSACTION');
  try {
    upsertCountries(database, countries);
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  return countries.length;
}
