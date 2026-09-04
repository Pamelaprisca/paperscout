import { Link, useNavigate, useParams } from "react-router";
import IssueForm from "../components/IssueForm.jsx";
import { getIssueById } from "../utils/issues.js";

export default function EditIssuePage({ issues, onUpdate }) {
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

  function handleUpdate(formData) {
    onUpdate(issue.id, formData);
    navigate(`/issues/${issue.id}`);
  }

  return (
    <main className="page-shell form-page">
      <div className="page-heading simple-heading">
        <div>
          <Link className="back-link" to={`/issues/${issue.id}`}>
            ← 返回任务详情
          </Link>
          <p className="eyebrow">TB-{issue.id}</p>
          <h1>编辑任务</h1>
          <p className="page-intro">只修改真正变化的内容，让任务保持易读。</p>
        </div>
      </div>

      <IssueForm
        initialIssue={issue}
        onSubmit={handleUpdate}
        submitLabel="保存修改"
      />
    </main>
  );
}
