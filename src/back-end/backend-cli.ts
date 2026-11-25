#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { deleteUnusedCountries } from './database/country-repository.ts';
import { deleteUnusedGenres } from './database/genre-repository.ts';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import {
  importCountries,
  parseCountriesCsv,
} from './services/country-import-service.ts';
import {
  importGenres,
  parseGenresCsv,
} from './services/genre-import-service.ts';

/** Command-line interface for movie database operations. */
const program = new Command().description('CLI for movie database operations');

program.option(
  '-p, --path <path>',
  'path to the SQLite database file',
  DEFAULT_DATABASE_PATH,
);

program
  .command('create-database')
  .description('Create and initialize the movies database schema')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action((options: { path?: string }) => {
    const path = options.path ?? program.opts<{ path: string }>().path;
    const database = getDatabase(path);
    database.close();
    console.log(`Database available at ${resolve(path)}`);
  });

program
  .command('add-countries <csv-file>')
  .description('Import or update countries from a CSV file')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action((csvFile: string, options: { path?: string }) => {
    const countries = parseCountriesCsv(readFileSync(csvFile, 'utf8'));
    const path = options.path ?? program.opts<{ path: string }>().path;
    const database = getDatabase(path);
    try {
      const imported = importCountries(database, countries);
      console.log(`Imported ${imported} countries into ${resolve(path)}`);
    } finally {
      database.close();
    }
  });

program
  .command('clean-countries')
  .description('Remove countries not associated with a movie')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action((options: { path?: string }) => {
    const path = options.path ?? program.opts<{ path: string }>().path;
    const database = getDatabase(path);
    try {
      const deleted = deleteUnusedCountries(database);
      console.log(`Removed ${deleted} unused countries from ${resolve(path)}`);
    } finally {
      database.close();
    }
  });

program
  .command('add-genres <csv-file>')
  .description('Import or update genres from a CSV file')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action((csvFile: string, options: { path?: string }) => {
    const genres = parseGenresCsv(readFileSync(csvFile, 'utf8'));
    const path = options.path ?? program.opts<{ path: string }>().path;
    const database = getDatabase(path);
    try {
      const imported = importGenres(database, genres);
      console.log(`Imported ${imported} genres into ${resolve(path)}`);
    } finally {
      database.close();
    }
  });

program
  .command('clean-genres')
  .description('Remove genres not associated with a movie')
  .option('-p, --path <path>', 'path to the SQLite database file')
  .action((options: { path?: string }) => {
    const path = options.path ?? program.opts<{ path: string }>().path;
    const database = getDatabase(path);
    try {
      const deleted = deleteUnusedGenres(database);
      console.log(`Removed ${deleted} unused genres from ${resolve(path)}`);
    } finally {
      database.close();
    }
  });

program.parse();
