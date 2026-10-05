import { NavLink } from "react-router-dom";

import "./NavBar.css";

export default function NavBar() {
  return (
    <nav className="navbar" aria-label="Navigation principale">
      <NavLink className="navbar__brand" to="/movies">
        TMDB Discovery
      </NavLink>
      <ul className="navbar__links">
        <li>
          <NavLink className="navbar__link" end to="/movies">
            Films populaires
          </NavLink>
        </li>
        <li>
          <NavLink className="navbar__link" to="/about">
            À propos
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
