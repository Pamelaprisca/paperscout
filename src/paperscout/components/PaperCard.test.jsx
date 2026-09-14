import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { PaperCard } from "./PaperCard.jsx";
import { ToastProvider } from "./Toast.jsx";

const paper = {
  id: "paper-1",
  title: "Test Paper",
  abstract: "A test abstract for the saved-paper interaction.",
  authors: ["Author A"],
  year: 2025,
  venue: "Test Venue",
  citationCount: 10,
  openAccess: true,
};

function renderCard() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <PaperCard paper={paper} />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("PaperCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and removes a paper from the collection", async () => {
    const user = userEvent.setup();
    renderCard();

    const saveButton = screen.getByRole("button", { name: "保存论文" });
    await user.click(saveButton);

    expect(
      screen.getByRole("button", { name: "取消保存论文" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      JSON.parse(window.localStorage.getItem("paperscout:selected-papers")),
    ).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "取消保存论文" }));

    expect(screen.getByRole("button", { name: "保存论文" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      JSON.parse(window.localStorage.getItem("paperscout:selected-papers")),
    ).toHaveLength(0);
  });

  it("encodes paper IDs in detail links", () => {
    const doiPaper = {
      ...paper,
      id: "doi:10.1145/3748302",
      title: "DOI Paper",
    };

    render(
      <MemoryRouter>
        <ToastProvider>
          <PaperCard paper={doiPaper} />
        </ToastProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "DOI Paper" })).toHaveAttribute(
      "href",
      "/papers/doi%3A10.1145%2F3748302",
    );
  });
});
