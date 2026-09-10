import { listPapers, upsertPapers } from "../db/database.js";
import { searchOpenAlex } from "./openalex.js";
import { searchSemanticScholar } from "./semantic-scholar.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function scorePaper(paper, query) {
  const tokens = normalize(query)
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return 0;

  const text = normalize([
    paper.title,
    paper.abstract,
    paper.venue,
    ...paper.authors,
    ...paper.tags,
  ].join(" "));

  return tokens.reduce((score, token) => {
    if (normalize(paper.title).includes(token)) return score + 4;
    if (paper.tags.map(normalize).includes(token)) return score + 3;
    if (text.includes(token)) return score + 1;
    return score;
  }, 0);
}

function rankPapers(papers, query) {
  return papers
    .map((paper) => ({
      paper,
      score: scorePaper(paper, query),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.paper.citationCount - a.paper.citationCount;
    })
    .map(({ paper, score }) => ({
      ...paper,
      relevanceScore: score,
    }));
}

export async function searchPapers(query, { limit = 10 } = {}) {
  let source = "sqlite";
  let papers = listPapers();

  for (const provider of [
    {
      name: "semantic-scholar",
      search: searchSemanticScholar,
    },
    {
      name: "openalex",
      search: searchOpenAlex,
    },
  ]) {
    try {
      const externalPapers = await provider.search(query, { limit });

      if (externalPapers.length > 0) {
        upsertPapers(externalPapers);
        papers = externalPapers;
        source = provider.name;
        break;
      }
    } catch (error) {
      console.warn(`${provider.name} fallback: ${error.message}`);
    }
  }

  return {
    source,
    papers: rankPapers(papers, query),
  };
}
