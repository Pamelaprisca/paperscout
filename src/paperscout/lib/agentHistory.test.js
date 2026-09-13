import { describe, expect, it } from "vitest";

import { buildAgentHistory } from "./agentHistory.js";

describe("buildAgentHistory", () => {
  it("removes a cancelled assistant turn and its user message", () => {
    const messages = [
      {
        role: "assistant",
        content: "Welcome",
      },
      {
        role: "user",
        content: "三篇论文的相通之处",
      },
      {
        role: "assistant",
        content: "",
        status: "cancelled",
      },
      {
        role: "user",
        content: "比较一下三篇论文的观点",
      },
      {
        role: "assistant",
        content: "三篇论文的共同点是……",
      },
    ];

    expect(buildAgentHistory(messages)).toEqual([
      {
        role: "assistant",
        content: "Welcome",
      },
      {
        role: "user",
        content: "比较一下三篇论文的观点",
      },
      {
        role: "assistant",
        content: "三篇论文的共同点是……",
      },
    ]);
  });

  it("removes partial text from a cancelled assistant turn", () => {
    const messages = [
      {
        role: "user",
        content: "保留的问题",
      },
      {
        role: "assistant",
        content: "保留的回答",
      },
      {
        role: "user",
        content: "取消的问题",
      },
      {
        role: "assistant",
        content: "写到一半",
        status: "cancelled",
      },
    ];

    expect(buildAgentHistory(messages)).toEqual([
      {
        role: "user",
        content: "保留的问题",
      },
      {
        role: "assistant",
        content: "保留的回答",
      },
    ]);
  });
});
