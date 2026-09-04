import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "../utils/issues.js";

export default function FilterBar({
  filters,
  onChange,
  onClear,
  searchRef,
}) {
  function updateFilter(name, value) {
    onChange((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  return (
    <section className="filter-panel" aria-label="筛选任务">
      <div className="field field-search">
        <label htmlFor="filter-search">搜索</label>
        <div className="search-control">
          <span aria-hidden="true">⌕</span>
          <input
            id="filter-search"
            ref={searchRef}
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="标题、描述、标签、负责人…"
          />
          <kbd>/</kbd>
        </div>
      </div>

      <label className="field" htmlFor="filter-status">
        <span>状态</span>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <option value="all">全部状态</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field" htmlFor="filter-priority">
        <span>优先级</span>
        <select
          id="filter-priority"
          value={filters.priority}
          onChange={(event) => updateFilter("priority", event.target.value)}
        >
          <option value="all">全部优先级</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field" htmlFor="filter-sort">
        <span>排序</span>
        <select
          id="filter-sort"
          value={filters.sort}
          onChange={(event) => updateFilter("sort", event.target.value)}
        >
          <option value="newest">最近更新</option>
          <option value="oldest">最早更新</option>
          <option value="priority">优先级</option>
          <option value="due">截止日期</option>
        </select>
      </label>

      <button
        className="button button-ghost filter-clear"
        type="button"
        onClick={onClear}
      >
        重置
      </button>
    </section>
  );
}
