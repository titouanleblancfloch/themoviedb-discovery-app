import { parse } from 'csv-parse/sync';
import type { DatabaseSync } from 'node:sqlite';
import { upsertGenres } from '../database/genre-repository.ts';
import type { Genre } from '../types/MoviesTypes.ts';

function parseGenreId(value: string, rowNumber: number): number {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id <= 0) {
    throw new Error(
      `Invalid genre id on CSV row ${rowNumber}: expected a positive integer`,
    );
  }

  return id;
}

export function parseGenresCsv(content: string): Genre[] {
  let rows: string[][];
  try {
    rows = parse(content, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    }) as string[][];
  } catch (error) {
    throw new Error(`Invalid genres CSV: ${String(error)}`);
  }

  if (rows.length === 0) {
    return [];
  }

  const header = rows[0].map((column) => column.toLowerCase());
  if (
    header.length !== 2 ||
    !header.includes('id') ||
    !header.includes('name')
  ) {
    throw new Error('Invalid genres CSV header: expected id and name');
  }

  const idIndex = header.indexOf('id');
  const nameIndex = header.indexOf('name');

  return rows.slice(1).map((row, index) => {
    const rowNumber = index + 2;
    if (row.length !== 2) {
      throw new Error(
        `Invalid genres CSV row ${rowNumber}: expected id and name`,
      );
    }

    const id = parseGenreId(row[idIndex], rowNumber);
    const name = row[nameIndex];
    if (!name) {
      throw new Error(
        `Invalid genre name on CSV row ${rowNumber}: name is empty`,
      );
    }

    return { id, name };
  });
}

export function importGenres(database: DatabaseSync, genres: Genre[]): number {
  database.exec('BEGIN TRANSACTION');
  try {
    upsertGenres(database, genres);
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  return genres.length;
}
