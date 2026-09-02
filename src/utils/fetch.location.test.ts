import { beforeEach, describe, expect, it } from "vitest";
import { preferActiveLocation } from "./fetch";

describe("preferActiveLocation", () => {
  beforeEach(() => window.localStorage.clear());

  it("puts the authenticated user's salon first for /api/locations", () => {
    window.localStorage.setItem("kleo_location_id", "salon-b");
    const items = [{ id: "salon-a" }, { id: "salon-b" }, { id: "salon-c" }];

    expect(preferActiveLocation("/api/locations", items).map((item) => item.id))
      .toEqual(["salon-b", "salon-a", "salon-c"]);
  });

  it("does not reorder unrelated API arrays", () => {
    window.localStorage.setItem("kleo_location_id", "salon-b");
    const items = [{ id: "salon-a" }, { id: "salon-b" }];

    expect(preferActiveLocation("/api/services", items)).toEqual(items);
  });

  it("keeps the server order if the current salon is not in the response", () => {
    window.localStorage.setItem("kleo_location_id", "salon-x");
    const items = [{ id: "salon-a" }, { id: "salon-b" }];

    expect(preferActiveLocation("/api/locations", items)).toEqual(items);
  });
});
