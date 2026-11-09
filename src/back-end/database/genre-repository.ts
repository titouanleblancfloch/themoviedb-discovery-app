import { DatabaseSync } from 'node:sqlite';
import type { Genre } from '../types/MoviesTypes.ts';

export function findGenreById(
  database: DatabaseSync,
  id: number,
): Genre | undefined {
  return database
    .prepare('SELECT id, name FROM genres WHERE id = ?')
    .get(id) as Genre | undefined;
}

export function findAllGenres(database: DatabaseSync): Genre[] {
  return database
    .prepare('SELECT id, name FROM genres ORDER BY id ASC')
    .all() as Genre[];
}

export function upsertGenres(
  database: DatabaseSync,
  genres: Iterable<Genre>,
): void {
  const statement = database.prepare(`
    INSERT INTO genres (id, name)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name
  `);

  for (const genre of genres) {
    statement.run(genre.id, genre.name);
  }
}
