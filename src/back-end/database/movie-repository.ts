import { DatabaseSync } from 'node:sqlite';

type Genre = {
  id: number;
  name: string;
};

type Country = {
  code: string;
  name: string;
};

type MovieRow = {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  release_date: string | null;
  popularity: number | null;
  vote_average: number | null;
  vote_count: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime_minutes: number | null;
  budget: number | null;
  revenue: number | null;
  collected_at: string;
};

export type MovieInput = Omit<MovieRow, 'collected_at'> & {
  collected_at?: string;
  genres?: Genre[];
  production_countries?: Country[];
};

export type StoredMovie = MovieRow & {
  genres: Genre[];
  production_countries: Country[];
};

function findGenres(database: DatabaseSync, movieId: number): Genre[] {
  return database
    .prepare(`
      SELECT genres.id, genres.name
      FROM genres
      INNER JOIN movie_genres
        ON movie_genres.genre_id = genres.id
      WHERE movie_genres.movie_id = ?
      ORDER BY genres.id ASC
    `)
    .all(movieId) as unknown as Genre[];
}

function findProductionCountries(
  database: DatabaseSync,
  movieId: number,
): Country[] {
  return database
    .prepare(`
      SELECT countries.code, countries.name
      FROM countries
      INNER JOIN production_countries
        ON production_countries.country_code = countries.code
      WHERE production_countries.movie_id = ?
      ORDER BY countries.code ASC
    `)
    .all(movieId) as unknown as Country[];
}

export function findMovieById(
  database: DatabaseSync,
  id: number,
): StoredMovie | undefined {
  const movie = database
    .prepare(`
      SELECT
        id,
        title,
        original_title,
        original_language,
        overview,
        release_date,
        popularity,
        vote_average,
        vote_count,
        poster_path,
        backdrop_path,
        runtime_minutes,
        budget,
        revenue,
        collected_at
      FROM movies
      WHERE id = ?
    `)
    .get(id) as unknown as MovieRow | undefined;

  if (!movie) {
    return undefined;
  }

  return {
    ...movie,
    genres: findGenres(database, id),
    production_countries: findProductionCountries(database, id),
  };
}

export function findAllMovies(database: DatabaseSync): StoredMovie[] {
  const movies = database
    .prepare(`
      SELECT
        id,
        title,
        original_title,
        original_language,
        overview,
        release_date,
        popularity,
        vote_average,
        vote_count,
        poster_path,
        backdrop_path,
        runtime_minutes,
        budget,
        revenue,
        collected_at
      FROM movies
      ORDER BY id ASC
    `)
    .all() as unknown as MovieRow[];

  return movies.map((movie) => ({
    ...movie,
    genres: findGenres(database, movie.id),
    production_countries: findProductionCountries(database, movie.id),
  }));
}

export function upsertMovie(
  database: DatabaseSync,
  movie: MovieInput,
): StoredMovie {
  const collectedAt = movie.collected_at ?? new Date().toISOString();
  const genres = movie.genres ?? [];
  const productionCountries = movie.production_countries ?? [];

  database.exec('BEGIN TRANSACTION');

  try {
    database
      .prepare(`
        INSERT INTO movies (
          id,
          title,
          original_title,
          original_language,
          overview,
          release_date,
          popularity,
          vote_average,
          vote_count,
          poster_path,
          backdrop_path,
          runtime_minutes,
          budget,
          revenue,
          collected_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          original_title = excluded.original_title,
          original_language = excluded.original_language,
          overview = excluded.overview,
          release_date = excluded.release_date,
          popularity = excluded.popularity,
          vote_average = excluded.vote_average,
          vote_count = excluded.vote_count,
          poster_path = excluded.poster_path,
          backdrop_path = excluded.backdrop_path,
          runtime_minutes = excluded.runtime_minutes,
          budget = excluded.budget,
          revenue = excluded.revenue,
          collected_at = excluded.collected_at
      `)
      .run(
        movie.id,
        movie.title,
        movie.original_title,
        movie.original_language,
        movie.overview,
        movie.release_date,
        movie.popularity,
        movie.vote_average,
        movie.vote_count,
        movie.poster_path,
        movie.backdrop_path,
        movie.runtime_minutes,
        movie.budget,
        movie.revenue,
        collectedAt,
      );

    database
      .prepare('DELETE FROM movie_genres WHERE movie_id = ?')
      .run(movie.id);

    database
      .prepare('DELETE FROM production_countries WHERE movie_id = ?')
      .run(movie.id);

    const genreUpsert = database.prepare(`
      INSERT INTO genres (id, name)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name
    `);

    const countryUpsert = database.prepare(`
      INSERT INTO countries (code, name)
      VALUES (?, ?)
      ON CONFLICT(code) DO UPDATE SET name = excluded.name
    `);

    const movieGenreInsert = database.prepare(`
      INSERT INTO movie_genres (movie_id, genre_id)
      VALUES (?, ?)
    `);

    const productionCountryInsert = database.prepare(`
      INSERT INTO production_countries (movie_id, country_code)
      VALUES (?, ?)
    `);

    for (const genre of genres) {
      genreUpsert.run(genre.id, genre.name);
      movieGenreInsert.run(movie.id, genre.id);
    }

    for (const country of productionCountries) {
      countryUpsert.run(country.code, country.name);
      productionCountryInsert.run(movie.id, country.code);
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }

  const savedMovie = findMovieById(database, movie.id);

  if (!savedMovie) {
    throw new Error(`Movie with ID ${movie.id} was not saved`);
  }

  return savedMovie;
}
