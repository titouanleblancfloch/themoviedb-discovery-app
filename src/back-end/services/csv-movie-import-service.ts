import { readFile } from 'node:fs/promises';
import type { DatabaseSync } from 'node:sqlite';
import { findGenreById } from '../database/genre-repository.ts';
import { type MovieInput, upsertMovie } from '../database/movie-repository.ts';

const CSV_COLUMNS = [
  'id',
  'title',
  'original_title',
  'original_language',
  'overview',
  'release_date',
  'popularity',
  'vote_average',
  'vote_count',
  'poster_path',
  'backdrop_path',
  'runtime',
  'budget',
  'revenue',
  'genres',
  'production_countries',
] as const;

type CsvRow = Record<(typeof CSV_COLUMNS)[number], string>;

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (inQuotes) {
      if (character === '"' && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      inQuotes = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error('CSV contains an unterminated quoted field');
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((currentRow) =>
    currentRow.some((value) => value.trim() !== ''),
  );
}

function toCsvRows(content: string): CsvRow[] {
  const [header, ...values] = parseCsvRows(content);
  if (!header) {
    return [];
  }

  const normalizedHeader = header.map((column, index) =>
    index === 0 ? column.replace(/^\uFEFF/, '') : column,
  );
  if (
    normalizedHeader.length !== CSV_COLUMNS.length ||
    normalizedHeader.some((column, index) => column !== CSV_COLUMNS[index])
  ) {
    throw new Error(`CSV header must contain: ${CSV_COLUMNS.join(',')}`);
  }

  return values.map((row, rowIndex) => {
    if (row.length !== CSV_COLUMNS.length) {
      throw new Error(
        `CSV row ${rowIndex + 2} contains ${row.length} columns; expected ${CSV_COLUMNS.length}`,
      );
    }

    return Object.fromEntries(
      CSV_COLUMNS.map((column, columnIndex) => [column, row[columnIndex]]),
    ) as CsvRow;
  });
}

function parseRequiredNumber(value: string, field: string, rowNumber: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`CSV row ${rowNumber} contains an invalid ${field}`);
  }
  return parsed;
}

function parseOptionalNumber(
  value: string,
  field: string,
  rowNumber: number,
): number | null {
  return value === '' ? null : parseRequiredNumber(value, field, rowNumber);
}

function parseJson(value: string, field: string, rowNumber: number): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`CSV row ${rowNumber} contains invalid JSON in ${field}`);
  }
}

function toMovieInput(
  database: DatabaseSync,
  row: CsvRow,
  rowNumber: number,
): MovieInput {
  const genreIds = parseJson(row.genres, 'genres', rowNumber);
  if (
    !Array.isArray(genreIds) ||
    genreIds.some((id) => !Number.isInteger(id))
  ) {
    throw new Error(`CSV row ${rowNumber} contains invalid genre IDs`);
  }

  const genres = genreIds.map((id) => {
    const genre = findGenreById(database, id);
    if (!genre) {
      throw new Error(`CSV row ${rowNumber} references unknown genre ${id}`);
    }
    return genre;
  });

  const productionCountries = parseJson(
    row.production_countries,
    'production_countries',
    rowNumber,
  );
  if (
    !Array.isArray(productionCountries) ||
    productionCountries.some(
      (country) =>
        typeof country !== 'object' ||
        country === null ||
        !('iso_3166_1' in country) ||
        !('name' in country) ||
        typeof country.iso_3166_1 !== 'string' ||
        typeof country.name !== 'string',
    )
  ) {
    throw new Error(
      `CSV row ${rowNumber} contains invalid production countries`,
    );
  }

  return {
    id: parseRequiredNumber(row.id, 'id', rowNumber),
    title: row.title,
    original_title: row.original_title,
    original_language: row.original_language,
    overview: row.overview,
    release_date: row.release_date || null,
    popularity: parseOptionalNumber(row.popularity, 'popularity', rowNumber),
    vote_average: parseOptionalNumber(
      row.vote_average,
      'vote_average',
      rowNumber,
    ),
    vote_count: parseOptionalNumber(row.vote_count, 'vote_count', rowNumber),
    poster_path: row.poster_path || null,
    backdrop_path: row.backdrop_path || null,
    runtime_minutes: parseOptionalNumber(row.runtime, 'runtime', rowNumber),
    budget: parseOptionalNumber(row.budget, 'budget', rowNumber),
    revenue: parseOptionalNumber(row.revenue, 'revenue', rowNumber),
    genres,
    production_countries: productionCountries.map((country) => ({
      code: country.iso_3166_1,
      name: country.name,
    })),
  };
}

export function importMoviesFromCsv(
  database: DatabaseSync,
  content: string,
): number {
  const movies = toCsvRows(content).map((row, index) =>
    toMovieInput(database, row, index + 2),
  );

  for (const movie of movies) {
    upsertMovie(database, movie);
  }

  return movies.length;
}

export async function importMoviesFromCsvFile(
  database: DatabaseSync,
  filePath: string,
): Promise<number> {
  const content = await readFile(filePath, 'utf8');
  return importMoviesFromCsv(database, content);
}
