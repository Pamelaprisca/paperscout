export async function saveEvidenceItems({ claim, items }) {
  const response = await fetch("/api/evidence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      claim,
      items,
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}
