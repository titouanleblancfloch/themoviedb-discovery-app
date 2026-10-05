import express from "express";
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from "./constants";
import type { MoviesApiResponse, TmdbMoviesRawResponse } from "./schemas/MoviesTypes";
import { toSupportedMovie } from "./utils";

export function createApp(tmdbAccessToken: string) {
  const app = express();
  const headers = {
    Authorization: `Bearer ${tmdbAccessToken}`,
    "Content-Type": "application/json;charset=utf-8",
  };

  app.get("/", (_req, res) => {
    res.send("Hello World from TypeScript! demo");
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/movies/popular", async (req, res) => {
    try {
      const { language, page, region } = req.query;
      const queryParams = new URLSearchParams({
        language: typeof language === "string" ? language : DEFAULT_LANGUAGE,
        page: typeof page === "string" ? page : DEFAULT_PAGE,
        region: typeof region === "string" ? region : DEFAULT_REGION,
      });
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?${queryParams.toString()}`,
        { headers },
      );

      if (!response.ok) {
        throw new Error(`TMDB API request failed with status ${response.status}`);
      }

      const rawData = (await response.json()) as TmdbMoviesRawResponse;
      const data: MoviesApiResponse = {
        page: rawData.page,
        results: rawData.results.map(toSupportedMovie),
        total_pages: rawData.total_pages,
        total_results: rawData.total_results,
      };

      res.json(data);
    } catch {
      res.status(500).json({ error: "Failed to fetch popular movies" });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { language } = req.query;
      const queryParams = new URLSearchParams({
        language: typeof language === "string" ? language : DEFAULT_LANGUAGE,
      });
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?${queryParams.toString()}`,
        { headers },
      );

      if (!response.ok) {
        throw new Error(`TMDB API request failed with status ${response.status}`);
      }

      res.json(await response.json());
    } catch {
      res.status(500).json({ error: "Failed to fetch movie details" });
    }
  });

  return app;
}
