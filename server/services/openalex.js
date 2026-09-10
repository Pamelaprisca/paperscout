const OPENALEX_ENDPOINT = "https://api.openalex.org/works";

function restoreAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== "object") {
    return "No abstract is available from OpenAlex.";
  }

  const words = [];

  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) {
      words[position] = word;
    }
  }

  return words.filter(Boolean).join(" ");
}

function createPaperId(work) {
  if (work.doi) return `doi:${work.doi.replace("https://doi.org/", "").toLowerCase()}`;
  return `openalex:${work.id.split("/").pop()}`;
}

function toPaper(work) {
  const doi = work.doi?.replace("https://doi.org/", "") ?? null;
  const concepts = Array.isArray(work.concepts)
    ? work.concepts.map((concept) => concept.display_name).filter(Boolean)
    : [];
  const topics = Array.isArray(work.topics)
    ? work.topics.map((topic) => topic.display_name).filter(Boolean)
    : [];

  return {
    id: createPaperId(work),
    externalSource: "openalex",
    externalId: work.id,
    doi,
    title: work.display_name?.trim() || "Untitled paper",
    abstract: restoreAbstract(work.abstract_inverted_index),
    authors: Array.isArray(work.authorships)
      ? work.authorships
          .map((authorship) => authorship.author?.display_name)
          .filter(Boolean)
      : [],
    year: work.publication_year ?? new Date().getFullYear(),
    venue:
      work.primary_location?.source?.display_name?.trim() || "Unknown venue",
    url:
      work.primary_location?.landing_page_url ||
      work.doi ||
      work.id,
    citationCount: work.cited_by_count ?? 0,
    openAccess: Boolean(work.open_access?.is_oa),
    tags: [...topics, ...concepts].slice(0, 5),
  };
}

export async function searchOpenAlex(query, { limit = 10 } = {}) {
  const url = new URL(OPENALEX_ENDPOINT);
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", String(limit));
  url.searchParams.set(
    "select",
    [
      "id",
      "doi",
      "display_name",
      "publication_year",
      "cited_by_count",
      "authorships",
      "primary_location",
      "open_access",
      "abstract_inverted_index",
      "concepts",
      "topics",
    ].join(","),
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PaperScout/0.1 (local development)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAlex returned ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.results) ? data.results.map(toPaper) : [];
  } finally {
    clearTimeout(timeoutId);
  }
}
