const LABELS = {
  todo: "待办",
  "in-progress": "进行中",
  done: "已完成",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge status-badge status-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
