import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { demoPapers } from "../data/demo-papers.js";

const serverDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const databaseDirectory = join(serverDirectory, "data");
const databasePath = join(databaseDirectory, "paperscout.sqlite");

mkdirSync(databaseDirectory, { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS papers (
    id TEXT PRIMARY KEY,
    external_source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    doi TEXT,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    authors_json TEXT NOT NULL,
    year INTEGER NOT NULL,
    venue TEXT NOT NULL,
    url TEXT NOT NULL,
    citation_count INTEGER NOT NULL DEFAULT 0,
    open_access INTEGER NOT NULL DEFAULT 0,
    tags_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_papers_external
  ON papers(external_source, external_id);

  CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    paper_id TEXT NOT NULL,
    claim TEXT NOT NULL,
    quote TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paper_id) REFERENCES papers(id)
  );

  CREATE TABLE IF NOT EXISTS paper_chunks (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_order INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paper_id) REFERENCES papers(id)
  );

  CREATE INDEX IF NOT EXISTS idx_chunks_paper
  ON paper_chunks(paper_id);
`);

const insertPaper = db.prepare(`
  INSERT OR IGNORE INTO papers (
    id,
    external_source,
    external_id,
    doi,
    title,
    abstract,
    authors_json,
    year,
    venue,
    url,
    citation_count,
    open_access,
    tags_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const upsertPaperStatement = db.prepare(`
  INSERT INTO papers (
    id,
    external_source,
    external_id,
    doi,
    title,
    abstract,
    authors_json,
    year,
    venue,
    url,
    citation_count,
    open_access,
    tags_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    external_source = excluded.external_source,
    external_id = excluded.external_id,
    doi = excluded.doi,
    title = excluded.title,
    abstract = excluded.abstract,
    authors_json = excluded.authors_json,
    year = excluded.year,
    venue = excluded.venue,
    url = excluded.url,
    citation_count = excluded.citation_count,
    open_access = excluded.open_access,
    tags_json = excluded.tags_json
`);

const deleteChunksStatement = db.prepare(
  "DELETE FROM paper_chunks WHERE paper_id = ?",
);

const insertChunkStatement = db.prepare(`
  INSERT INTO paper_chunks (
    id,
    paper_id,
    content,
    chunk_order
  ) VALUES (?, ?, ?, ?)
`);

function seedDatabase() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM papers").get();

  if (count.count > 0) return;

  for (const paper of demoPapers) {
    insertPaper.run(
      paper.id,
      paper.externalSource,
      paper.externalId,
      paper.doi,
      paper.title,
      paper.abstract,
      JSON.stringify(paper.authors),
      paper.year,
      paper.venue,
      paper.url,
      paper.citationCount,
      paper.openAccess ? 1 : 0,
      JSON.stringify(paper.tags),
    );
  }
}

function rowToPaper(row) {
  return {
    id: row.id,
    externalSource: row.external_source,
    externalId: row.external_id,
    doi: row.doi,
    title: row.title,
    abstract: row.abstract,
    authors: JSON.parse(row.authors_json),
    year: row.year,
    venue: row.venue,
    url: row.url,
    citationCount: row.citation_count,
    openAccess: Boolean(row.open_access),
    tags: JSON.parse(row.tags_json),
  };
}

function splitIntoChunks(text, maximumLength = 280) {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[。！？.!?])\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if (current && current.length + sentence.length > maximumLength) {
      chunks.push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function indexPaper(paper) {
  deleteChunksStatement.run(paper.id);

  const chunks = splitIntoChunks(
    [paper.title, paper.abstract, paper.tags.join(" ")].join(". "),
  );

  chunks.forEach((content, index) => {
    insertChunkStatement.run(
      `${paper.id}:chunk:${index}`,
      paper.id,
      content,
      index,
    );
  });
}

function backfillChunks() {
  const papers = db.prepare("SELECT * FROM papers").all().map(rowToPaper);
  const countStatement = db.prepare(
    "SELECT COUNT(*) AS count FROM paper_chunks WHERE paper_id = ?",
  );

  db.exec("BEGIN");

  try {
    for (const paper of papers) {
      const count = countStatement.get(paper.id);
      if (count.count === 0) indexPaper(paper);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

seedDatabase();
backfillChunks();

export function listPapers() {
  return db.prepare("SELECT * FROM papers").all().map(rowToPaper);
}

export function getPaperById(paperId) {
  const row = db
    .prepare("SELECT * FROM papers WHERE id = ?")
    .get(paperId);

  return row ? rowToPaper(row) : null;
}

export function upsertPapers(papers) {
  db.exec("BEGIN");

  try {
    for (const paper of papers) {
      upsertPaperStatement.run(
        paper.id,
        paper.externalSource,
        paper.externalId,
        paper.doi,
        paper.title,
        paper.abstract,
        JSON.stringify(paper.authors ?? []),
        paper.year,
        paper.venue,
        paper.url,
        paper.citationCount ?? 0,
        paper.openAccess ? 1 : 0,
        JSON.stringify(paper.tags ?? []),
      );

      indexPaper(paper);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const insertEvidence = db.prepare(`
  INSERT INTO evidence (
    id,
    project_id,
    paper_id,
    claim,
    quote
  ) VALUES (?, ?, ?, ?, ?)
`);

export function saveEvidence({ id, projectId = null, paperId, claim, quote = null }) {
  insertEvidence.run(id, projectId, paperId, claim, quote);

  return {
    id,
    projectId,
    paperId,
    claim,
    quote,
  };
}

function tokenize(value) {
  return String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/i)
    .flatMap((part) => {
      const token = part.trim();
      if (!token) return [];

      if (/[\u4e00-\u9fff]/.test(token)) {
        if (token.length <= 2) return [token];

        const grams = [];
        for (let index = 0; index < token.length - 1; index += 1) {
          grams.push(token.slice(index, index + 2));
        }
        return grams;
      }

      return token.length >= 2 ? [token] : [];
    });
}

export function searchPaperChunks(query, { paperIds = [], limit = 5 } = {}) {
  const rows = db
    .prepare(`
      SELECT
        paper_chunks.id AS chunk_id,
        paper_chunks.content AS chunk_content,
        paper_chunks.chunk_order,
        papers.*
      FROM paper_chunks
      JOIN papers ON papers.id = paper_chunks.paper_id
    `)
    .all();

  const allowedPaperIds = new Set(paperIds.filter(Boolean));
  const tokens = tokenize(query);

  const scored = rows
    .filter((row) => {
      return allowedPaperIds.size === 0 || allowedPaperIds.has(row.id);
    })
    .map((row) => {
      const paper = rowToPaper(row);
      const searchable = `${row.chunk_content} ${paper.title} ${paper.tags.join(" ")}`.toLowerCase();
      const score = tokens.reduce(
        (total, token) => total + (searchable.includes(token) ? 1 : 0),
        0,
      );

      return {
        chunkId: row.chunk_id,
        chunkOrder: row.chunk_order,
        content: row.chunk_content,
        score,
        paper,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.paper.citationCount - a.paper.citationCount;
    });

  if (scored.length > 0) {
    return scored.slice(0, limit);
  }

  return rows
    .filter((row) => {
      return allowedPaperIds.size === 0 || allowedPaperIds.has(row.id);
    })
    .slice(0, limit)
    .map((row) => ({
      chunkId: row.chunk_id,
      chunkOrder: row.chunk_order,
      content: row.chunk_content,
      score: 0,
      paper: rowToPaper(row),
    }));
}

export function getDatabasePath() {
  return databasePath;
}
