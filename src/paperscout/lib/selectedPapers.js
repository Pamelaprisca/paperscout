const STORAGE_KEY = "paperscout:selected-papers";

function read() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(papers) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
  } catch {
    // The UI still works for the current session if storage is unavailable.
  }
}

export function getSelectedPapers() {
  return read();
}

export function isPaperSelected(paperId) {
  return read().some((paper) => paper.id === paperId);
}

export function toggleSelectedPaper(paper) {
  const papers = read();
  const exists = papers.some((item) => item.id === paper.id);
  const next = exists
    ? papers.filter((item) => item.id !== paper.id)
    : [...papers, paper];

  write(next);
  return !exists;
}
