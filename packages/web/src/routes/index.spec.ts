import { render, screen } from "@testing-library/svelte";

import Index from "./index.svelte";

describe("Index", () => {
  describe("once component rendered", () => {
    render(Index);

    test("should show heading", () => {
      expect(screen.getByText(/Hello/)).toBeInTheDocument();
    });
  });
});
