import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EvidencePanel } from "./EvidencePanel.jsx";
import { ToastProvider } from "./Toast.jsx";
import { saveEvidenceItems } from "../api/evidence.js";

vi.mock("../api/evidence.js", () => ({
  saveEvidenceItems: vi.fn().mockResolvedValue({ total: 1, evidence: [] }),
}));

const items = [
  {
    id: "evidence-paper-1:chunk:0",
    paperId: "paper-1",
    paperTitle: "Paper One",
    paperYear: 2025,
    chunkId: "paper-1:chunk:0",
    quote: "Retrieved context improves grounded answers.",
    score: 3,
    supported: true,
    reason: "The passage directly addresses retrieval context.",
  },
  {
    id: "missing-paper-2",
    paperId: "paper-2",
    paperTitle: "Paper Two",
    paperYear: 2024,
    chunkId: null,
    quote: "",
    score: 0,
    supported: false,
    reason: "未找到支持",
  },
];

describe("EvidencePanel", () => {
  it("shows missing support and saves selected evidence", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <EvidencePanel claim="Which retrieval method works?" items={items} />
      </ToastProvider>,
    );

    expect(screen.getByText("未找到支持")).toBeInTheDocument();

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByRole("button", { name: /保存为证据/ }));

    await waitFor(() => {
      expect(saveEvidenceItems).toHaveBeenCalledWith({
        claim: "Which retrieval method works?",
        items: [
          {
            paperId: "paper-1",
            chunkId: "paper-1:chunk:0",
          },
        ],
      });
    });
  });
});
