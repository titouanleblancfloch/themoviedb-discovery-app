import express from "express";
import { tmdbAccessToken } from "./config";
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from "./constants";
import type { MoviesApiResponse, TmdbMoviesRawResponse } from "./schemas/MoviesTypes";
import { toSupportedMovie } from "./utils";

// Create a new express application instance
const app = express();

// Define the port number for the server to listen on
const port: number = 3000;

// Define a route handler for the root URL ('/')
app.get("/", (_req: express.Request, res: express.Response) => {
  res.send("Hello World from TypeScript! demo");
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Example app in TypeScript listening on port ${port}`);
});

// Define a route handler for health check endpoint
app.get("/api/health", (_req: express.Request, res: express.Response) => {
  const response: { status: string } = { status: "ok" };
  res.json(response);
});

// Define a route handler for fetching popular movies from TMDB API
app.get("/api/movies/popular", async (req: express.Request, res: express.Response) => {
  try {
    // Create a URLSearchParams object to build the query string for the TMDB API request
    const queryParams = new URLSearchParams();

    // Extract query parameters from the request and append them to the query string
    const { language, page, region } = req.query;

    queryParams.append("language", (language as string) || DEFAULT_LANGUAGE);
    queryParams.append("page", (page as string) || DEFAULT_PAGE);
    queryParams.append("region", (region as string) || DEFAULT_REGION);

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${tmdbAccessToken}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`TMDB API request failed with status ${response.status}`);
    }

    // Parse the raw response from the TMDB API
    const rawData = (await response.json()) as TmdbMoviesRawResponse;

    // Transform the raw data into the supported format for our application
    const data: MoviesApiResponse = {
      page: rawData.page,
      results: rawData.results.map(toSupportedMovie),
      total_pages: rawData.total_pages,
      total_results: rawData.total_results,
    };

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch popular movies" });
  }
});

app.get("/api/movies/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { language } = req.query;
    const queryParams = new URLSearchParams();

    queryParams.append("language", (language as string) || DEFAULT_LANGUAGE);

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${tmdbAccessToken}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`TMDB API request failed with status ${response.status}`);
    }

    const rawData = (await response.json()) as {
      backdrop_path: string | null;
      genres: Array<{ id: number; name: string }>;
      id: number;
      original_language: string;
      original_title: string;
      overview: string;
      popularity: number;
      poster_path: string | null;
      release_date: string;
      tagline: string | null;
      title: string;
      vote_average: number;
      vote_count: number;
    };

    const data = {
      backdrop_path: rawData.backdrop_path,
      genres: rawData.genres,
      id: rawData.id,
      original_language: rawData.original_language,
      original_title: rawData.original_title,
      overview: rawData.overview,
      popularity: rawData.popularity,
      poster_path: rawData.poster_path,
      release_date: rawData.release_date,
      tagline: rawData.tagline,
      title: rawData.title,
      vote_average: rawData.vote_average,
      vote_count: rawData.vote_count,
    };

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});
