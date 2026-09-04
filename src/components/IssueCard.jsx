import { Link } from "react-router";
import { formatShortDate, isOverdue } from "../utils/issues.js";
import PriorityBadge from "./PriorityBadge.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function IssueCard({ issue }) {
  const {
    id,
    title,
    description,
    status,
    priority,
    assignee,
    tags,
    dueDate,
  } = issue;

  const overdue = isOverdue(issue);

  function handleDragStart(event) {
    event.dataTransfer.setData("text/issue-id", String(id));
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <article
      className="issue-card"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="issue-card-topline">
        <span className="issue-key">TB-{id}</span>
        <PriorityBadge priority={priority} />
      </div>

      <div className="issue-card-copy">
        <h3 className="issue-title">
          <Link to={`/issues/${id}`}>{title}</Link>
        </h3>
        <p className="issue-description">{description}</p>
      </div>

      <div className="tag-list" aria-label="Issue tags">
        {tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <footer className="issue-card-footer">
        <div className="issue-person">
          <span className="avatar" aria-hidden="true">
            {assignee?.[0]?.toUpperCase() ?? "?"}
          </span>
          <span>{assignee || "未分配"}</span>
        </div>

        <span className={overdue ? "due-date due-overdue" : "due-date"}>
          {overdue ? "已逾期 · " : ""}
          {formatShortDate(dueDate)}
        </span>
      </footer>

      <div className="sr-only">
        <StatusBadge status={status} />
      </div>
    </article>
  );
}
