import { useState } from "react";
import { NavLink } from "react-router";
import ThemeToggle from "./ThemeToggle.jsx";

function navClassName({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

function TrashDropZone({ onDelete }) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(event) {
    event.preventDefault();
    setIsDragOver(false);

    const issueId = Number(event.dataTransfer.getData("text/issue-id"));
    if (Number.isFinite(issueId) && onDelete) {
      onDelete(issueId);
    }
  }

  return (
    <div
      className={`trash-drop-zone${isDragOver ? " trash-drop-over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      title="拖拽任务到此处删除"
      aria-label="拖拽任务到此处删除"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
      <span>删除区</span>
    </div>
  );
}

export default function Header({ theme, onThemeToggle, onDelete }) {
  return (
    <header className="app-header">
      <NavLink className="brand" to="/" aria-label="TinyBoard home">
        <span className="brand-mark" aria-hidden="true">
          T
        </span>
        <span>TinyBoard</span>
      </NavLink>

      <nav className="main-nav" aria-label="主导航">
        <TrashDropZone onDelete={onDelete} />

        <NavLink className={navClassName} to="/">
          看板
        </NavLink>

        <ThemeToggle theme={theme} onToggle={onThemeToggle} />

        <NavLink className="button button-primary" to="/issues/new">
          新建任务
          <kbd>N</kbd>
        </NavLink>
      </nav>
    </header>
  );
}
