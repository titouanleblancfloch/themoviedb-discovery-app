import './DashboardPage.css';

export default function DashboardPage() {
  return (
    <main className="app-shell dashboard-page">
      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <p className="dashboard-intro">
          Une vue d'ensemble des films, de leurs genres et de leurs pays de
          production.
        </p>
      </header>

      <section
        className="dashboard-widgets"
        aria-labelledby="dashboard-widgets-title"
      >
        <h2 id="dashboard-widgets-title">Indicateurs</h2>
        <p className="dashboard-empty" role="status">
          Aucun widget n'est configuré pour le moment.
        </p>
      </section>
    </main>
  );
}
