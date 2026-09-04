export default function PriorityBadge({ priority }) {
  return (
    <span className={`badge priority-badge priority-${priority}`}>
      {priority}
    </span>
  );
}
