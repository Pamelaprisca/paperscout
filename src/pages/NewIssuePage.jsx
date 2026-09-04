import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AiIssueGenerator from "../components/AiIssueGenerator.jsx";
import IssueForm from "../components/IssueForm.jsx";
import { parseDateFromText } from "../utils/date.js";

export default function NewIssuePage({ onCreate }) {
  const navigate = useNavigate();
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [draftVersion, setDraftVersion] = useState(0);

  function handleGenerated(data) {
    setGeneratedDraft({
      ...data,
      dueDate: data.dueDate || parseDateFromText(data.description || ""),
    });
    setDraftVersion((version) => version + 1);
  }

  function handleCreate(formData) {
    const newIssue = onCreate(formData);
    navigate(`/issues/${newIssue.id}`);
  }

  return (
    <main className="page-shell form-page">
      <div className="page-heading simple-heading">
        <div>
          <Link className="back-link" to="/">
            ← Back to board
          </Link>
          <p className="eyebrow">Create</p>
          <h1>新建任务</h1>
          <p className="page-intro">标题保持清晰，把关键上下文写在描述里。</p>
        </div>
      </div>

      <AiIssueGenerator onGenerated={handleGenerated} />

      <IssueForm
        key={draftVersion}
        initialIssue={generatedDraft}
        onSubmit={handleCreate}
        submitLabel="创建任务"
        showStatus={false}
      />
    </main>
  );
}
