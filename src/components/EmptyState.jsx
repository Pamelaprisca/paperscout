export default function EmptyState({ filtered, onClear }) {
  if (filtered) {
    return (
      <div className="empty-state">
        <p className="empty-icon" aria-hidden="true">
          ⌕
        </p>
        <h2>没有符合条件的任务</h2>
        <p>换一个搜索词，或清空当前筛选条件。</p>
        <button className="button button-ghost" type="button" onClick={onClear}>
          清空筛选
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <p className="empty-icon" aria-hidden="true">
        +
      </p>
      <h2>看板还是空的</h2>
      <p>创建第一个任务，让 TinyBoard 开始运转。</p>
    </div>
  );
}
