import { useRef, useState } from "react";
import BoardColumn from "../components/BoardColumn.jsx";
import AiBoardSummary from "../components/AiBoardSummary.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcut.js";
import {
  countIssuesByStatus,
  filterIssues,
  sortIssues,
} from "../utils/issues.js";

const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  priority: "all",
  sort: "newest",
};

const COLUMNS = [
  { status: "todo", title: "待办" },
  { status: "in-progress", title: "进行中" },
  { status: "done", title: "已完成" },
];

export default function BoardPage({ issues, onStatusChange }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const searchInputRef = useRef(null);
  const debouncedSearch = useDebouncedValue(filters.search);
  const counts = countIssuesByStatus(issues);

  const filteredIssues = filterIssues(issues, {
    ...filters,
    search: debouncedSearch,
  });

  const visibleIssues = sortIssues(filteredIssues, filters.sort);
  const isFiltered =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.priority !== "all";

  useKeyboardShortcut("/", (event) => {
    event.preventDefault();
    searchInputRef.current?.focus();
  });

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const visibleColumns =
    filters.status === "all"
      ? COLUMNS
      : COLUMNS.filter((column) => column.status === filters.status);

  return (
    <main className="page-shell board-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>任务看板</h1>
          <p className="page-intro">
            Keep the work visible, small and moving.
          </p>
        </div>

        <div className="stats" aria-label="Issue counts">
          <span>
            <strong>{issues.length}</strong> 全部
          </span>
          <span>
            <strong>{counts.todo}</strong> 待办
          </span>
          <span>
            <strong>{counts["in-progress"]}</strong> 进行中
          </span>
          <span>
            <strong>{counts.done}</strong> 已完成
          </span>
        </div>
      </section>

      <FilterBar
        searchRef={searchInputRef}
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
      />

      <AiBoardSummary issues={issues} />

      {visibleIssues.length === 0 ? (
        <EmptyState filtered={isFiltered} onClear={clearFilters} />
      ) : (
        <section className="board-grid" aria-label="Issue board">
          {visibleColumns.map((column) => (
            <BoardColumn
              key={column.status}
              title={column.title}
              status={column.status}
              onStatusChange={onStatusChange}
              issues={visibleIssues.filter(
                (issue) => issue.status === column.status,
              )}
            />
          ))}
        </section>
      )}
    </main>
  );
}
