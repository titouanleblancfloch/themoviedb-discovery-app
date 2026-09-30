import { Navigate, Route, Routes } from "react-router-dom";
import MovieDetailPage from "./pages/MovieDetailPage";
import MoviesListPage from "./pages/MoviesListPage";
import NotFoundPage from "./pages/NotFoundPage";
import "./app.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/movies" replace />} />
      <Route path="/movies" element={<MoviesListPage />} />
      <Route path="/movies/:id" element={<MovieDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
