import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="app-shell">
      <h1>Page introuvable</h1>
      <Link to="/movies">Retour à la liste</Link>
    </main>
  );
}
