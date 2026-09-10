import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getPaperById,
  searchPaperChunks,
} from "./db/database.js";
import {
  confirmAgentAction,
  streamAgentChat,
} from "./services/agent-chat.js";
import { getCache, getCacheMode, setCache } from "./services/cache.js";
import { searchPapers } from "./services/paper-search.js";

const app = express();
const rootDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const distDirectory = join(rootDirectory, "dist");
const distIndex = join(distDirectory, "index.html");

app.use(cors());
app.use(express.json());

app.get("/api/health", (request, response) => {
  response.json({
    ok: true,
    service: "paperscout-api",
    mode: "sqlite+semantic-scholar+openalex",
    cache: getCacheMode(),
  });
});

app.post("/api/search", async (request, response) => {
  const query = String(request.body?.query ?? "").trim();

  if (!query) {
    return response.status(400).json({
      error: "请输入研究问题或检索关键词",
    });
  }

  const cacheKey = `search:${query.toLowerCase()}:10`;
  const cached = await getCache(cacheKey);

  if (cached) {
    return response.json({
      ...cached,
      cache: "hit",
    });
  }

  const { source, papers } = await searchPapers(query, { limit: 10 });
  const payload = {
    query,
    total: papers.length,
    source,
    papers,
  };

  await setCache(cacheKey, payload, 900);

  return response.json({
    ...payload,
    cache: "miss",
  });
});

app.get("/api/papers/:paperId", (request, response) => {
  const paper = getPaperById(request.params.paperId);

  if (!paper) {
    return response.status(404).json({ error: "Paper not found" });
  }

  return response.json(paper);
});

app.post("/api/rag/search", async (request, response) => {
  const query = String(request.body?.query ?? "").trim();

  if (!query) {
    return response.status(400).json({
      error: "请输入检索问题",
    });
  }

  const paperIds = Array.isArray(request.body?.paperIds)
    ? request.body.paperIds
    : [];
  const limit = Number(request.body?.limit || 5);
  const cacheKey = `rag:${query.toLowerCase()}:${[...paperIds].sort().join(",")}:${limit}`;
  const cached = await getCache(cacheKey);

  if (cached) {
    return response.json({
      ...cached,
      cache: "hit",
    });
  }

  const results = searchPaperChunks(query, {
    paperIds,
    limit,
  });

  const payload = {
    query,
    total: results.length,
    results,
  };

  await setCache(cacheKey, payload, 600);

  return response.json({
    ...payload,
    cache: "miss",
  });
});

app.post("/api/agent/chat", async (request, response) => {
  const message = String(request.body?.message ?? "").trim();

  if (!message) {
    return response.status(400).json({
      error: "请输入问题",
    });
  }

  const selectedPapers = Array.isArray(request.body?.selectedPapers)
    ? request.body.selectedPapers
    : [];
  const history = Array.isArray(request.body?.history)
    ? request.body.history
    : [];

  await streamAgentChat({
    response,
    message,
    selectedPapers,
    history,
  });
});

app.post("/api/agent/actions/:actionId/confirm", (request, response) => {
  try {
    const result = confirmAgentAction(request.params.actionId);
    return response.status(201).json(result);
  } catch (error) {
    return response.status(error.status || 500).json({
      error: error.message || "Action failed",
    });
  }
});

app.use("/api", (request, response) => {
  response.status(404).json({ error: "Route not found" });
});

if (existsSync(distIndex)) {
  app.use(express.static(distDirectory));
  app.use((request, response, next) => {
    if (request.method !== "GET") return next();
    return response.sendFile(distIndex);
  });
}

app.use((request, response) => {
  response.status(404).json({ error: "Route not found" });
});

app.use((error, request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

export default app;
