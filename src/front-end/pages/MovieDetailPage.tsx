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
    return (
      <main className="app-shell">
        <h1>Movie id: {id}</h1>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Movie id: {id}</h1>
      </header>
      <section>
        <p>{movie.overview}</p>
        <p>
          {movie.release_date} · Note {movie.vote_average.toFixed(1)}
        </p>
        <Link to="/movies">Retour à la liste</Link>
      </section>
    </main>
  );
}
