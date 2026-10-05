import { Link } from "react-router-dom";

import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <p className="footer__copyright">© {new Date().getFullYear()} TMDB Discovery</p>
        <ul className="footer__links">
          <li>
            <Link to="/movies">Films populaires</Link>
          </li>
          <li>
            <Link to="/about">À propos</Link>
          </li>
          <li>
            <a
              href="https://github.com/titouanleblancfloch/themoviedb-discovery-app"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </li>
        </ul>
        <span>Version {__APP_VERSION__}</span>
      </div>
    </footer>
  );
}
