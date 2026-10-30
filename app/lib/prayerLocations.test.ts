import { describe, expect, it, vi } from "vitest";
import { findPrayerLocation, loadPrayerLocations, searchPrayerLocations } from "./prayerLocations";
import type { PrayerLocationOption } from "./types";

const LOCATIONS: PrayerLocationOption[] = [
  {
    countryCode: "US",
    country: "United States",
    city: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
    geonameId: 5128581
  },
  {
    countryCode: "US",
    country: "United States",
    city: "York",
    latitude: 39.9626,
    longitude: -76.7277,
    timezone: "America/New_York",
    geonameId: 4562407
  },
  {
    countryCode: "US",
    country: "United States",
    city: "St. Louis",
    latitude: 38.627,
    longitude: -90.1994,
    timezone: "America/Chicago",
    geonameId: 4407066
  },
  {
    countryCode: "GB",
    country: "United Kingdom",
    city: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: "Europe/London",
    geonameId: 2643743
  }
];

describe("prayer location search", () => {
  it("ranks direct and prefix matches first", () => {
    const results = searchPrayerLocations(LOCATIONS, {
      countryCode: "US",
      query: "new yo",
      limit: 5
    });
    expect(results[0]?.city).toBe("New York");
  });

  it("matches tokenized city queries in any order", () => {
    const results = searchPrayerLocations(LOCATIONS, {
      countryCode: "US",
      query: "york new",
      limit: 5
    });
    expect(results[0]?.city).toBe("New York");
  });

  it("matches punctuation-insensitive queries", () => {
    const results = searchPrayerLocations(LOCATIONS, {
      countryCode: "US",
      query: "stlouis",
      limit: 5
    });
    expect(results[0]?.city).toBe("St. Louis");
  });
});

describe("find prayer location", () => {
  it("resolves partial and punctuation-insensitive city names", () => {
    const found = findPrayerLocation(LOCATIONS, "US", "st louis");
    expect(found?.geonameId).toBe(4407066);
  });
});


describe("bundled GeoNames locations", () => {
  it("finds the major cities without a network request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network must not be used"));
    try {
      const locations = await loadPrayerLocations();
      for (const [countryCode, query] of [
        ["BD", "Dhaka"], ["BD", "Chittagong"], ["PK", "Karachi"], ["PK", "Lahore"],
        ["IN", "Delhi"], ["IN", "Mumbai"], ["ID", "Jakarta"], ["EG", "Cairo"],
        ["TR", "Istanbul"], ["GB", "London"], ["US", "New York"]
      ]) {
        expect(searchPrayerLocations(locations, { countryCode, query })[0]?.city).toContain(query);
        expect(findPrayerLocation(locations, countryCode, query)?.timezone).toBeTruthy();
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
