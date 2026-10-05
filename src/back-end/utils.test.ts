import { describe, expect, it } from "vitest";
import { toSupportedMovie } from "./utils";

describe("toSupportedMovie", () => {
  it("keeps supported movie fields and removes TMDB-only fields", () => {
    const movie = toSupportedMovie({
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
    });

    expect(movie).toEqual({
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
    });
  });
});
