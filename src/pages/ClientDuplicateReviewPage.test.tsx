import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ClientDuplicateReviewPage from "./ClientDuplicateReviewPage";

jest.mock("../utils/apiBase", () => ({ __esModule: true, default: (path: string) => `/${path}` }));

const response = (payload: unknown) => Promise.resolve({
  ok: true,
  status: 200,
  json: async () => payload,
} as Response);

describe("ClientDuplicateReviewPage", () => {
  beforeEach(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("kleo_location_id", "loc-1");
    jest.restoreAllMocks();
  });

  test("shows pending duplicate pair and keeps approval disabled for read-only users", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation(() => response({
      can_approve: false,
      history: [],
      pending: [{
        pair_key: "client-a:client-b",
        match_reasons: ["email", "phone"],
        client_a: { id: "client-a", name: "Teszt Anna", email: "anna@example.com", phone: "+36 30 111 1111", location_id: "loc-1", visits: 8, spent: 120000 },
        client_b: { id: "client-b", name: "Teszt Anna régi", email: "anna@example.com", phone: "+36 30 111 1111", location_id: "loc-1", visits: 3, spent: 45000 },
      }],
    }));

    render(<MemoryRouter><ClientDuplicateReviewPage /></MemoryRouter>);

    expect(await screen.findByText("Teszt Anna")).toBeInTheDocument();
    expect(screen.getByText("E-mail egyezés")).toBeInTheDocument();
    expect(screen.getByText("Telefonszám egyezés")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Összevonás jóváhagyása/i })).toBeDisabled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/clients/duplicate-review?location_id=loc-1", expect.any(Object)));
  });
});
