import { useEffect, useState } from "react";
import type { Movie } from "../back-end/schemas/MoviesTypes";
import MovieItem from "./components/MovieItem";
import "./app.css";

export default function App() {
  const [movies, setMovies] = useState<Movie[] | null>(null);

  useEffect(() => {
    fetch("/api/movies/popular")
      .then((response) => response.json())
      .then((data) => setMovies(data.results));
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Films populaires</h1>
        <h2>
          Films tendances en France, d'après les données de <b>The Movie Database</b>
        </h2>
      </header>
      <section>
        {movies ? (
          <ul className="movie-grid">
            {movies.map((movie) => (
              <li key={movie.id}>
                <article>
                  <MovieItem movie={movie} />
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="status-message">Loading...</p>
        )}
      </section>
    </main>
  );
}
