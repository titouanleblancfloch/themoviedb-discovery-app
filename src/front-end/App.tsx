import { useEffect, useState } from "react";
import type { Movie } from "../back-end/schemas/MoviesTypes";
import MovieItem from "./components/MovieItem";

export default function App() {
  const [movies, setMovies] = useState<Movie[] | null>(null);

  useEffect(() => {
    fetch("/api/movies/popular")
      .then((response) => response.json())
      .then((data) => setMovies(data.results));
  }, []);

  return (
    <div>
      <h1>Popular Movies</h1>

      {movies ? (
        <ul>
          {movies.map((movie) => (
            <MovieItem key={movie.id} movie={movie} />
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
