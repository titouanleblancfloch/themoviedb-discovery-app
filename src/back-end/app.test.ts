import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app";

const popularResponse = {
  page: 1,
  results: [
    {
      adult: false,
      backdrop_path: "/backdrop.jpg",
      genre_ids: [18],
      id: 42,
      original_language: "fr",
      original_title: "Film original",
      overview: "Synopsis",
      popularity: 12.5,
      poster_path: "/poster.jpg",
      release_date: "2026-01-01",
      title: "Film",
      video: false,
      vote_average: 8.2,
      vote_count: 100,
    },
  ],
  total_pages: 1,
  total_results: 1,
};

const detailsResponse = {
  backdrop_path: "/backdrop.jpg",
  genres: [{ id: 18, name: "Drame" }],
  id: 42,
  original_language: "fr",
  original_title: "Film original",
  overview: "Synopsis",
  popularity: 12.5,
  poster_path: "/poster.jpg",
  release_date: "2026-01-01",
  tagline: "Une histoire",
  title: "Film",
  vote_average: 8.2,
  vote_count: 100,
};

const fetchMock = vi.fn<typeof fetch>();
const requestFetch = fetch;

function responseWith(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

async function request(path: string) {
  const server = createApp("test-token").listen(0);
  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Test server did not expose a TCP address");
  }

  try {
    return await requestFetch(`http://127.0.0.1:${address.port}${path}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("backend API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns the health status", async () => {
    const response = await request("/api/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("fetches popular movies with default query parameters", async () => {
    fetchMock.mockResolvedValue(responseWith(popularResponse));

    const response = await request("/api/movies/popular");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      page: 1,
      results: [
        {
          backdrop_path: "/backdrop.jpg",
          genre_ids: [18],
          id: 42,
          original_language: "fr",
          original_title: "Film original",
          overview: "Synopsis",
          popularity: 12.5,
          poster_path: "/poster.jpg",
          release_date: "2026-01-01",
          title: "Film",
          vote_average: 8.2,
          vote_count: 100,
        },
      ],
      total_pages: 1,
      total_results: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.themoviedb.org/3/movie/popular?language=fr-FR&page=1&region=FR",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("forwards custom popular movie query parameters", async () => {
    fetchMock.mockResolvedValue(responseWith(popularResponse));

    await request("/api/movies/popular?language=en-US&page=3&region=US");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.themoviedb.org/3/movie/popular?language=en-US&page=3&region=US",
      expect.any(Object),
    );
  });

  it("returns an error when popular movies cannot be fetched", async () => {
    fetchMock.mockResolvedValue(responseWith({ message: "Unavailable" }, 503));

    const response = await request("/api/movies/popular");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to fetch popular movies" });
  });

  it("fetches movie details with the requested language", async () => {
    fetchMock.mockResolvedValue(responseWith(detailsResponse));

    const response = await request("/api/movies/42?language=en-US");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(detailsResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.themoviedb.org/3/movie/42?language=en-US",
      expect.any(Object),
    );
  });

  it("returns an error when movie details cannot be fetched", async () => {
    fetchMock.mockResolvedValue(responseWith({ message: "Unavailable" }, 404));

    const response = await request("/api/movies/42");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to fetch movie details" });
  });
});
