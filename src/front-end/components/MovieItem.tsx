import type { Movie } from "../../back-end/schemas/MoviesTypes";

type MovieItemProps = {
  movie: Movie;
};

export default function MovieItem({ movie }: MovieItemProps) {
  const releaseYear = movie.release_date.slice(0, 4);
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
    : null;
  const rating = movie.vote_average.toFixed(1);

  return (
    <div>
      {posterUrl ? <img src={posterUrl} alt={`Affiche de ${movie.title}`} /> : <div />}

      <div>
        <h2>{movie.title}</h2>
        <p>
          {releaseYear} · Note {rating}
        </p>
      </div>
    </div>
  );
}
