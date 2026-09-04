import { useState } from "react";

export default function AiIssueGenerator({ onGenerated }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleGenerate() {
    const text = prompt.trim();
    if (!text || loading) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/ai/generate-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "AI 生成失败");
      }

      onGenerated({
        title: data.title || "",
        description: data.description || "",
        priority: data.priority || "medium",
        tags: Array.isArray(data.tags) ? data.tags : [],
      });

      setPrompt("");
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-tool-panel" aria-label="AI issue generator">
      <div className="ai-tool-heading">
        <div>
          <p className="eyebrow">AI assist</p>
          <h2>用一句话生成任务</h2>
        </div>
        <span className="ai-tool-badge">Beta</span>
      </div>

      <label className="field" htmlFor="ai-issue-prompt">
        <span>任务描述</span>
        <textarea
          id="ai-issue-prompt"
          rows="3"
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
            setSuccess(false);
          }}
          placeholder="例如：移动端导航栏在平板宽度下重叠，需要修复"
        />
      </label>

      {error && (
        <p className="ai-error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="ai-success">已生成，请确认下方表单内容</p>}

      <button
        className="button button-primary"
        type="button"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
      >
        {loading ? "生成中..." : "AI 生成任务"}
      </button>
    </section>
  );
}
