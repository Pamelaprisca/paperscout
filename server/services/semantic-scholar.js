const SEMANTIC_SCHOLAR_ENDPOINT =
  "https://api.semanticscholar.org/graph/v1/paper/search";

function createPaperId(paper) {
  const doi = paper.externalIds?.DOI;
  if (doi) return `doi:${doi.toLowerCase()}`;
  return `s2:${paper.paperId}`;
}

function createPaperUrl(paper) {
  if (paper.url) return paper.url;

  const doi = paper.externalIds?.DOI;
  if (doi) return `https://doi.org/${doi}`;

  return `https://www.semanticscholar.org/paper/${paper.paperId}`;
}

function toPaper(paper) {
  const doi = paper.externalIds?.DOI ?? null;
  const fields = Array.isArray(paper.fieldsOfStudy)
    ? paper.fieldsOfStudy.filter(Boolean).slice(0, 5)
    : [];

  return {
    id: createPaperId(paper),
    externalSource: "semantic-scholar",
    externalId: paper.paperId,
    doi,
    title: paper.title?.trim() || "Untitled paper",
    abstract:
      paper.abstract?.trim() ||
      "No abstract is available from Semantic Scholar.",
    authors: Array.isArray(paper.authors)
      ? paper.authors.map((author) => author.name).filter(Boolean)
      : [],
    year: paper.year ?? new Date().getFullYear(),
    venue: paper.venue?.trim() || "Unknown venue",
    url: createPaperUrl(paper),
    citationCount: paper.citationCount ?? 0,
    openAccess: Boolean(paper.openAccessPdf?.url),
    tags: fields,
  };
}

export async function searchSemanticScholar(query, { limit = 10 } = {}) {
  const url = new URL(SEMANTIC_SCHOLAR_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set(
    "fields",
    [
      "paperId",
      "title",
      "abstract",
      "authors.name",
      "year",
      "venue",
      "url",
      "citationCount",
      "externalIds",
      "openAccessPdf",
      "fieldsOfStudy",
    ].join(","),
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const headers = {
      Accept: "application/json",
    };

    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
    }

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Semantic Scholar returned ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.data) ? data.data.map(toPaper) : [];
  } finally {
    clearTimeout(timeoutId);
  }
}
