import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import PaperScoutApp from "./PaperScoutApp.jsx";

function renderApp(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PaperScoutApp />
    </MemoryRouter>,
  );
}

describe("PaperScout foundation", () => {
  it("renders the research dashboard", () => {
    renderApp();

    expect(
      screen.getByRole("heading", {
        name: /从研究问题开始/,
      }),
    ).toBeInTheDocument();
  });

  it.each([
    ["/discover", /检索候选论文/],
    ["/papers/demo-paper", /A Survey on Memory Mechanisms/],
    ["/collections/demo", /文献集合/],
    ["/agent", /对文献库进行提问/],
  ])("renders %s", (route, heading) => {
    renderApp(route);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });
});
