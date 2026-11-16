import type { DatabaseSync } from 'node:sqlite';
import { upsertCountries } from '../database/country-repository.ts';
import { upsertGenres } from '../database/genre-repository.ts';
import { type MovieInput, upsertMovie } from '../database/movie-repository.ts';
import { tmdbAccessToken } from '../utils/config.ts';
import type { TmdbMovieDetails } from '../types/MoviesTypes.ts';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

type TmdbGenre = {
  id: number;
  name: string;
};

type TmdbCountry = {
  iso_3166_1: string;
  english_name: string;
};

type TmdbMovieDetailsForSync = TmdbMovieDetails & {
  runtime: number | null;
  budget: number;
  revenue: number;
  production_countries: Array<{
    iso_3166_1: string;
    name: string;
  }>;
};

type SyncOptions = {
  accessToken?: string;
  fetcher?: typeof fetch;
};

export type SyncResult = {
  movies: number;
  genres: number;
  countries: number;
};

async function fetchTmdb<T>(
  path: string,
  accessToken: string,
  fetcher: typeof fetch,
): Promise<T> {
  const response = await fetcher(`${TMDB_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json;charset=utf-8',
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function toMovieInput(movie: TmdbMovieDetailsForSync): MovieInput {
  return {
    id: movie.id,
    title: movie.title,
    original_title: movie.original_title,
    original_language: movie.original_language,
    overview: movie.overview,
    release_date: movie.release_date || null,
    popularity: movie.popularity,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    runtime_minutes: movie.runtime,
    budget: movie.budget,
    revenue: movie.revenue,
    genres: movie.genres,
    production_countries: movie.production_countries.map((country) => ({
      code: country.iso_3166_1,
      name: country.name,
    })),
  };
}

export async function syncTmdbData(
  database: DatabaseSync,
  movieIds: Iterable<number>,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const accessToken = options.accessToken ?? tmdbAccessToken;
  const fetcher = options.fetcher ?? globalThis.fetch;
  const ids = [...movieIds];

  const [genres, countries] = await Promise.all([
    fetchTmdb<TmdbGenre[]>('/genre/movie/list', accessToken, fetcher),
    fetchTmdb<TmdbCountry[]>('/configuration/countries', accessToken, fetcher),
  ]);

  upsertGenres(database, genres);
  upsertCountries(
    database,
    countries.map((country) => ({
      code: country.iso_3166_1,
      name: country.english_name,
    })),
  );

  for (const movieId of ids) {
    const movie = await fetchTmdb<TmdbMovieDetailsForSync>(
      `/movie/${movieId}`,
      accessToken,
      fetcher,
    );
    upsertMovie(database, toMovieInput(movie));
  }

  return {
    movies: ids.length,
    genres: genres.length,
    countries: countries.length,
  };
}
