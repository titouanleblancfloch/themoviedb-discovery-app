import { useId } from 'react';
import './MoviesCountWidget.css';

interface MoviesCountWidgetProps {
  /** Number of movies stored in the database, or null when it is unknown. */
  count: number | null;
}

const numberFormatter = new Intl.NumberFormat('fr-FR');

export default function MoviesCountWidget({ count }: MoviesCountWidgetProps) {
  const titleId = useId();

  return (
    <article className="movies-count-widget" aria-labelledby={titleId}>
      <h3 id={titleId} className="movies-count-widget-title">
        Films en base
      </h3>
      {count === null ? (
        <p className="movies-count-widget-unavailable">Donnée indisponible</p>
      ) : (
        <p className="movies-count-widget-value">
          <strong>{numberFormatter.format(count)}</strong>{' '}
          {count > 1 ? 'films' : 'film'}
        </p>
      )}
    </article>
  );
}
