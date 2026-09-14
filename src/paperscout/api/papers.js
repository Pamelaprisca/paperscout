async function readJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

export async function searchPapers({ query }) {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  return readJson(response);
}

export async function getPaper(paperId) {
  const response = await fetch(`/api/papers/${encodeURIComponent(paperId)}`);
  return readJson(response);
}

export async function getPaperEvidence(paperId) {
  const response = await fetch(
    `/api/papers/${encodeURIComponent(paperId)}/evidence`,
  );
  return readJson(response);
}
