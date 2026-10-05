import "./about-page.css";

const technologies = [
  ["TypeScript", "Typage et fiabilité"],
  ["React", "Interface composable"],
  ["Node.js + Express", "API légère"],
  ["Vite", "Développement rapide"],
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="about-eyebrow">TMDB DISCOVERY</p>
        <h1>À propos de l&apos;application</h1>
        <p className="about-intro">
          Une application de découverte de films, pensée comme une expérience web claire, rapide et
          maintenable.
        </p>
      </section>

      <section className="about-section about-project">
        <div>
          <p className="about-eyebrow">LE PROJET</p>
          <h2>Découvrir, comparer, choisir</h2>
        </div>
        <p>
          Cette application utilise l&apos;API de{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
            The Movie Database
          </a>{" "}
          pour rendre les films populaires faciles à explorer. Elle démontre la construction
          d&apos;une application complète, du front-end à l&apos;API.
        </p>
      </section>

      <section className="about-section about-stack">
        <div>
          <p className="about-eyebrow">FONDATIONS TECHNIQUES</p>
          <h2>Une stack volontairement simple</h2>
        </div>
        <ul className="about-technologies">
          {technologies.map(([name, description]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span>{description}</span>
            </li>
          ))}
        </ul>
      </section>

      <a
        className="about-source"
        href="https://github.com/titouanleblancfloch/themoviedb-discovery-app"
        target="_blank"
        rel="noreferrer"
      >
        <span>
          <span className="about-eyebrow">CODE SOURCE</span>
          <strong>Voir la réalisation du projet</strong>
        </span>
        <span className="about-source-button">Ouvrir le dépôt GitHub</span>
      </a>
    </main>
  );
}
