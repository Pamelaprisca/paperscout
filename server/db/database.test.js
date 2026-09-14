import { describe, expect, it } from "vitest";

import {
  getPaperChunkById,
  listEvidenceByPaperId,
} from "./database.js";

describe("paper detail data", () => {
  it("returns an indexed chunk by ID", () => {
    const chunk = getPaperChunkById("agent-memory-survey:chunk:0");

    expect(chunk).toMatchObject({
      paperId: "agent-memory-survey",
      chunkOrder: 0,
    });
    expect(chunk.content).toEqual(expect.any(String));
  });

  it("returns empty lists when a paper has no stored evidence", () => {
    expect(getPaperChunkById("missing-chunk")).toBeNull();
    expect(listEvidenceByPaperId("missing-paper")).toEqual([]);
  });
});
