const STORAGE_KEY = "paperscout:search-session";

export function getSearchSession() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : null;

    if (!parsed || typeof parsed !== "object") return null;
    return {
      query: String(parsed.query ?? ""),
      source: String(parsed.source ?? ""),
      results: Array.isArray(parsed.results) ? parsed.results : [],
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return null;
  }
}

export function saveSearchSession({ query, source, results }) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        query,
        source,
        results,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Search results still remain in memory when storage is unavailable.
  }
}
