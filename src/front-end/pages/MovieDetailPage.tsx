import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { MovieDetails } from "../../back-end/schemas/MoviesTypes";

const DEFAULT_LANGUAGE = "fr-FR";

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<MovieDetails | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    fetch(`/api/movies/${id}?language=${DEFAULT_LANGUAGE}`)
      .then((response) => response.json())
      .then((data) => setMovie(data));
  }, [id]);

  if (!movie) {
    return <p className="status-message">Loading...</p>;
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : null;

  return (
    <main className="app-shell movie-detail-shell">
      <header className="movie-detail-header">
        <h1>Détails du film</h1>
        <Link to="/movies">← Retour vers les films populaires</Link>
      </header>

      <article className="movie-detail-card">
        <figure className="movie-detail-hero-container">
          {posterUrl ? (
            <img className="movie-detail-hero" src={posterUrl} alt={`Affiche de ${movie.title}`} />
          ) : (
            <div className="movie-detail-hero movie-detail-hero-placeholder" />
          )}
        </figure>

        <div className="movie-detail-copy">
          <p className="movie-detail-kicker">Détails du film</p>
          <h1>{movie.title}</h1>
          {movie.tagline ? <p className="movie-detail-tagline">{movie.tagline}</p> : null}

          <dl className="movie-detail-meta">
            <div>
              <dt>Année de sortie</dt>
              <dd>{movie.release_date.slice(0, 4)}</dd>
            </div>
            <div>
              <dt>Note</dt>
              <dd>{movie.vote_average.toFixed(1)}</dd>
            </div>
          </dl>

          {movie.genres.length > 0 ? (
            <section className="movie-detail-section movie-detail-genres-section">
              <h2>Genres</h2>
              <ul className="movie-detail-genres">
                {movie.genres.map((genre) => (
                  <li key={genre.id}>{genre.name}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="movie-detail-section">
            <h2>Résumé</h2>
            <p>{movie.overview || "Aucun synopsis disponible."}</p>
          </section>
        </div>
      </article>
    </main>
  );
}
