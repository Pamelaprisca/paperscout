export const STATUS_OPTIONS = [
  { value: "todo", label: "待办" },
  { value: "in-progress", label: "进行中" },
  { value: "done", label: "已完成" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function getNextIssueId(issues) {
  if (issues.length === 0) return 101;
  return Math.max(...issues.map((issue) => issue.id)) + 1;
}

export function getIssueById(issues, issueId) {
  return issues.find((issue) => issue.id === Number(issueId));
}

export function countIssuesByStatus(issues) {
  return {
    todo: issues.filter((issue) => issue.status === "todo").length,
    "in-progress": issues.filter((issue) => issue.status === "in-progress").length,
    done: issues.filter((issue) => issue.status === "done").length,
  };
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function filterIssues(issues, filters) {
  const search = normalize(filters.search);

  return issues.filter((issue) => {
    const matchesSearch =
      search === "" ||
      [
        issue.title,
        issue.description,
        issue.assignee,
        ...issue.tags,
      ]
        .map(normalize)
        .some((value) => value.includes(search));

    const matchesStatus =
      filters.status === "all" || issue.status === filters.status;

    const matchesPriority =
      filters.priority === "all" || issue.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
}

export function sortIssues(issues, sortBy) {
  return [...issues].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    }

    if (sortBy === "priority") {
      const weight = { high: 3, medium: 2, low: 1 };
      return weight[b.priority] - weight[a.priority];
    }

    if (sortBy === "due") {
      const aDate = a.dueDate ? new Date(a.dueDate) : new Date("2999-12-31");
      const bDate = b.dueDate ? new Date(b.dueDate) : new Date("2999-12-31");
      return aDate - bDate;
    }

    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

export function formatShortDate(value) {
  if (!value) return "无截止日期";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function isOverdue(issue, now = new Date()) {
  if (!issue.dueDate || issue.status === "done") return false;

  const endOfDueDate = new Date(`${issue.dueDate}T23:59:59`);
  return endOfDueDate < now;
}

export function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index);
}
