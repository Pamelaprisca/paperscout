import { Link, useNavigate, useParams } from "react-router";
import DeleteIssueButton from "../components/DeleteIssueButton.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import {
  STATUS_OPTIONS,
  formatShortDate,
  getIssueById,
  isOverdue,
} from "../utils/issues.js";

export default function IssueDetailsPage({
  issues,
  onDelete,
  onStatusChange,
}) {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const issue = getIssueById(issues, issueId);

  if (!issue) {
    return (
      <main className="page-shell narrow-page">
        <p className="eyebrow">未找到</p>
        <h1>任务不存在</h1>
        <p className="page-intro">任务可能已被删除，或链接地址不正确。</p>
        <Link className="button button-primary" to="/">
          返回看板
        </Link>
      </main>
    );
  }

  const overdue = isOverdue(issue);

  function handleDelete() {
    onDelete(issue.id);
    navigate("/");
  }

  return (
    <main className="page-shell details-page">
      <div className="details-topbar">
        <Link className="back-link" to="/">
          ← 返回看板
        </Link>

        <Link className="button button-ghost" to={`/issues/${issue.id}/edit`}>
          编辑任务
        </Link>
      </div>

      <article className="issue-details">
        <header className="details-header">
          <div>
            <p className="eyebrow">TB-{issue.id}</p>
            <h1>{issue.title}</h1>
          </div>

          <div className="details-badges">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
        </header>

        <p className="issue-details-description">{issue.description}</p>

        <section className="metadata-grid" aria-label="任务信息">
          <div className="meta-block">
            <span>负责人</span>
            <strong>{issue.assignee || "未分配"}</strong>
          </div>

          <div className="meta-block">
            <span>截止日期</span>
            <strong className={overdue ? "due-overdue" : ""}>
              {overdue ? "已逾期 · " : ""}
              {formatShortDate(issue.dueDate)}
            </strong>
          </div>

          <div className="field meta-status-control">
            <label htmlFor="issue-detail-status">状态</label>
            <select
              id="issue-detail-status"
              value={issue.status}
              onChange={(event) =>
                onStatusChange(issue.id, event.target.value)
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="detail-tags" aria-label="Tags">
          <h2>Tags</h2>
          <div className="tag-list">
            {issue.tags.length > 0 ? (
              issue.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))
            ) : (
              <span className="muted">无标签</span>
            )}
          </div>
        </section>

        <section className="danger-zone">
          <div>
            <h2>删除任务</h2>
            <p>删除后任务会从本地 TinyBoard 中移除。</p>
          </div>

          <DeleteIssueButton
            issueTitle={issue.title}
            onDelete={handleDelete}
          />
        </section>
      </article>
    </main>
  );
}
