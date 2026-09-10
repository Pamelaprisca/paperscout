import { randomUUID } from "node:crypto";

import {
  getPaperById,
  saveEvidence,
  searchPaperChunks,
} from "../db/database.js";
import { searchPapers } from "./paper-search.js";

const PROVIDER_URL =
  process.env.AI_BASE_URL || "https://api.deepseek.com/chat/completions";
const PROVIDER_MODEL = process.env.AI_MODEL || "deepseek-chat";
const API_KEY =
  process.env.AI_API_KEY ||
  process.env.DEEPSEEK_API_KEY ||
  process.env.OPENAI_API_KEY;

function writeEvent(response, event) {
  response.write(`${JSON.stringify(event)}\n`);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const pendingActions = new Map();

function wantsSearch(message) {
  return /(搜索|检索|查找|找一下|帮我找|find|search)/i.test(message);
}

function wantsCompare(message) {
  return /(比较|对比|差异|区别|compare)/i.test(message);
}

function wantsEvidence(message) {
  return /(保存|记录)/i.test(message);
}

function extractClaim(message) {
  const parts = message.split(/[:：]/);
  return (parts[1] || parts[0]).trim();
}

function emitToolStart(response, name, label, args) {
  writeEvent(response, {
    type: "tool_start",
    name,
    label,
    args,
  });
}

function emitToolResult(response, name, summary, count) {
  writeEvent(response, {
    type: "tool_result",
    name,
    summary,
    count,
  });
}

async function streamAssistantText(response, text, signal) {
  const chunks = text
    .split(/(?<=[。！？])/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    if (signal.aborted) return;
    await sleep(120);
    writeEvent(response, {
      type: "message_delta",
      text: `${chunk}\n`,
    });
  }
}

function buildMockChunks(message, selectedPapers) {
  const titles = selectedPapers
    .map((paper) => paper.title)
    .filter(Boolean)
    .slice(0, 3);

  if (titles.length > 0) {
    return [
      "我先基于当前选中的论文来回答。",
      `当前上下文包含 ${titles.length} 篇论文，分别是：${titles.join("、")}。`,
      `你的问题是“${message}”。`,
      "这部分先展示流式交互链路。下一步接入 Agent 工具后，我会先检索证据，再比较论文观点，并在每个结论后附上引用来源。",
      "当前阶段可以验证：消息逐段返回、生成状态切换和停止按钮。",
    ];
  }

  return [
    "目前还没有选中论文，所以只能给出通用回答。",
    `你问的是“${message}”。`,
    "后续接入 RAG 后，我会先从论文摘要中检索相关片段，再生成带引用的结论。",
    "现在这条消息用于验证流式传输、Markdown 渲染入口和前端状态管理。",
  ];
}

async function streamMock({ response, message, selectedPapers, signal }) {
  const chunks = buildMockChunks(message, selectedPapers);

  writeEvent(response, {
    type: "status",
    text: "正在准备回答",
  });

  for (const chunk of chunks) {
    if (signal.aborted) return;

    await sleep(220);

    writeEvent(response, {
      type: "message_delta",
      text: `${chunk}\n\n`,
    });
  }
}

async function streamModel({ response, message, selectedPapers, history, signal }) {
  const systemPrompt = [
    "You are PaperScout, an academic literature research assistant.",
    "Answer in the same language as the user.",
    "Use the selected paper metadata as context.",
    "Never pretend a paper contains evidence that is not in the provided context.",
    "Return concise, practical answers for literature review work.",
  ].join(" ");

  const context = selectedPapers.length
    ? JSON.stringify(selectedPapers.slice(0, 8), null, 2)
    : "No paper is selected.";

  const providerResponse = await fetch(PROVIDER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: PROVIDER_MODEL,
      stream: true,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "system",
          content: `Selected papers:\n${context}`,
        },
        ...history
          .filter((item) => item.role === "user" || item.role === "assistant")
          .slice(-8)
          .map((item) => ({
            role: item.role,
            content: item.content,
          })),
        { role: "user", content: message },
      ],
    }),
    signal,
  });

  if (!providerResponse.ok || !providerResponse.body) {
    throw new Error(`AI provider returned ${providerResponse.status}`);
  }

  const reader = providerResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      const data = JSON.parse(payload);
      const text = data.choices?.[0]?.delta?.content;

      if (text) {
        writeEvent(response, {
          type: "message_delta",
          text,
        });
      }
    }
  }
}

async function streamToolAgent({
  response,
  message,
  selectedPapers,
  signal,
}) {
  if (wantsEvidence(message) && selectedPapers.length > 0) {
    const paper = selectedPapers[0];
    const actionId = `action-${randomUUID()}`;
    const claim = extractClaim(message);

    pendingActions.set(actionId, {
      id: actionId,
      type: "saveEvidence",
      paperId: paper.id,
      claim,
    });

    writeEvent(response, {
      type: "action_proposed",
      action: {
        id: actionId,
        type: "saveEvidence",
        title: "保存引用证据",
        description: `将“${claim}”保存为《${paper.title}》的引用证据。`,
        paper,
      },
    });

    return {
      handled: true,
      citations: [paper],
    };
  }

  if (wantsCompare(message) && selectedPapers.length >= 2) {
    emitToolStart(response, "comparePapers", "正在比较论文", {
      count: selectedPapers.length,
    });
    await sleep(180);
    emitToolResult(
      response,
      "comparePapers",
      `已读取 ${selectedPapers.length} 篇论文的摘要和元数据`,
      selectedPapers.length,
    );

    const lines = selectedPapers
      .slice(0, 4)
      .map(
        (paper, index) =>
          `${index + 1}. ${paper.title}（${paper.year}，${paper.venue}）`,
      )
      .join("\n");

    await streamAssistantText(
      response,
      `已完成论文元数据对齐，当前比较集合包括：\n${lines}\n下一步接入真实检索工具后，会继续比较方法、数据集和结论。\n`,
      signal,
    );

    return {
      handled: true,
      citations: selectedPapers.slice(0, 4),
    };
  }

  if (wantsSearch(message)) {
    const query = message
      .replace(/^(帮我)?(搜索|检索|查找|找一下|find|search)\s*[:：]?\s*/i, "")
      .trim() || message;

    emitToolStart(response, "searchPapers", "正在检索论文", { query });
    const result = await searchPapers(query, { limit: 5 });
    emitToolResult(
      response,
      "searchPapers",
      `从 ${result.source} 返回 ${result.papers.length} 篇论文`,
      result.papers.length,
    );

    if (result.papers.length === 0) {
      await streamAssistantText(response, "没有找到匹配论文，请换一个关键词。", signal);
    } else {
      const lines = result.papers
        .slice(0, 5)
        .map(
          (paper, index) =>
            `${index + 1}. ${paper.title}（${paper.year}，${paper.venue}）`,
        )
        .join("\n");

      await streamAssistantText(
        response,
        `找到以下候选论文：\n${lines}\n你可以继续让我比较这些论文，或者指定某一篇查看详情。`,
        signal,
      );
    }

    return {
      handled: true,
      citations: result.papers.slice(0, 5),
    };
  }

  if (selectedPapers.length > 0) {
    const paperIds = selectedPapers.map((paper) => paper.id);

    emitToolStart(response, "searchChunks", "正在检索论文片段", {
      paperCount: paperIds.length,
      query: message,
    });

    const chunks = searchPaperChunks(message, {
      paperIds,
      limit: 5,
    });

    emitToolResult(
      response,
      "searchChunks",
      `命中 ${chunks.length} 个相关片段`,
      chunks.length,
    );

    if (chunks.length === 0) {
      await streamAssistantText(
        response,
        "当前选中论文中没有找到与该问题直接相关的摘要片段。可以换一个关键词，或先扩大论文集合。",
        signal,
      );
    } else {
      const evidenceText = chunks
        .slice(0, 3)
        .map(
          (chunk, index) =>
            `${index + 1}. 《${chunk.paper.title}》：${chunk.content.slice(0, 180)}`,
        )
        .join("\n\n");

      await streamAssistantText(
        response,
        `我检索到以下相关证据片段：\n\n${evidenceText}\n\n这些片段可以继续整理成引用证据或 Related Work 草稿。`,
        signal,
      );
    }

    const citationMap = new Map();
    chunks.forEach((chunk) => citationMap.set(chunk.paper.id, chunk.paper));

    return {
      handled: true,
      citations: [...citationMap.values()],
    };
  }

  return null;
}

export async function streamAgentChat({
  response,
  message,
  selectedPapers = [],
  history = [],
}) {
  const abortController = new AbortController();

  response.on("close", () => {
    if (!response.writableEnded) {
      abortController.abort();
    }
  });

  response.status(200);
  response.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();

  try {
    const toolResult = await streamToolAgent({
      response,
      message,
      selectedPapers,
      signal: abortController.signal,
    });

    if (!toolResult && API_KEY) {
      await streamModel({
        response,
        message,
        selectedPapers,
        history,
        signal: abortController.signal,
      });
    } else if (!toolResult) {
      await streamMock({
        response,
        message,
        selectedPapers,
        signal: abortController.signal,
      });
    }

    if (!abortController.signal.aborted) {
      const citations = toolResult?.citations ?? selectedPapers.slice(0, 8);
      writeEvent(response, {
        type: "citations",
        papers: citations,
      });
      writeEvent(response, {
        type: "done",
      });
    }
  } catch (error) {
    if (!abortController.signal.aborted) {
      writeEvent(response, {
        type: "error",
        message: error.message || "AI request failed",
      });
    }
  } finally {
    response.end();
  }
}

export function confirmAgentAction(actionId) {
  const action = pendingActions.get(actionId);

  if (!action) {
    const error = new Error("Action not found or already handled");
    error.status = 404;
    throw error;
  }

  if (action.type === "saveEvidence") {
    const paper = getPaperById(action.paperId);

    if (!paper) {
      const error = new Error("Paper not found");
      error.status = 404;
      throw error;
    }

    const evidence = saveEvidence({
      id: `evidence-${randomUUID()}`,
      paperId: paper.id,
      claim: action.claim,
    });

    pendingActions.delete(actionId);

    return {
      ...evidence,
      paper,
    };
  }

  const error = new Error("Unsupported action");
  error.status = 400;
  throw error;
}
