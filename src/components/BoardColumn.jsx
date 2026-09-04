import { useState } from "react";
import IssueCard from "./IssueCard.jsx";

export default function BoardColumn({
  title,
  status,
  issues,
  onStatusChange,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragOver(false);

    const issueId = Number(event.dataTransfer.getData("text/issue-id"));
    const movedIssue = issues.find((issue) => issue.id === issueId);

    if (!movedIssue && onStatusChange && Number.isFinite(issueId)) {
      onStatusChange(issueId, status);
    }
  }

  return (
    <section
      className={`board-column${isDragOver ? " column-drag-over" : ""}`}
      aria-labelledby={`column-${status}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <header className="column-header">
        <div>
          <span className={`status-dot status-dot-${status}`} aria-hidden="true" />
          <h2 id={`column-${status}`}>{title}</h2>
        </div>
        <span className="column-count" aria-label={`${issues.length} issues`}>
          {issues.length}
        </span>
      </header>

      <div className="column-list">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </section>
  );
}
