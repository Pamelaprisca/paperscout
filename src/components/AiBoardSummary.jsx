import { useState } from "react";

export default function AiBoardSummary({ issues }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSummarize() {
    if (loading) return;

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/ai/board-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "AI 总结失败");
      }

      if (
        data.summary &&
        !Array.isArray(data.completed) &&
        !Array.isArray(data.upcoming)
      ) {
        setReport({ summary: data.summary });
      } else {
        setReport({
          summary: data.summary || "",
          completed: Array.isArray(data.completed) ? data.completed : [],
          inProgress: Array.isArray(data.inProgress) ? data.inProgress : [],
          overdue: Array.isArray(data.overdue) ? data.overdue : [],
          upcoming: Array.isArray(data.upcoming) ? data.upcoming : [],
          nextStep: data.nextStep || "",
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-summary-tool" aria-label="AI board summary">
      <div className="ai-summary-row">
        <div>
          <p className="eyebrow">AI report</p>
          <h2>看板周报 / 状态总结</h2>
        </div>
        <button
          className="button button-ghost"
          type="button"
          onClick={handleSummarize}
          disabled={loading || issues.length === 0}
        >
          {loading ? "总结中..." : "生成看板总结"}
        </button>
      </div>

      {error && <p className="ai-error">{error}</p>}

      {report && (
        <div className="ai-summary-output">
          {report.summary && <p className="ai-summary-lead">{report.summary}</p>}

          {report.completed?.length > 0 && (
            <div className="ai-summary-section">
              <strong>已完成</strong>
              <ul>
                {report.completed.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {report.inProgress?.length > 0 && (
            <div className="ai-summary-section">
              <strong>进行中</strong>
              <ul>
                {report.inProgress.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {report.overdue?.length > 0 && (
            <div className="ai-summary-section ai-section-danger">
              <strong>逾期</strong>
              <ul>
                {report.overdue.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {report.upcoming?.length > 0 && (
            <div className="ai-summary-section">
              <strong>即将到期与准备事项</strong>
              <ul>
                {report.upcoming.map((item, index) => (
                  <li key={index}>
                    <span>
                      {item.title}
                      {Number.isFinite(item.daysUntilDue) &&
                        `（${item.daysUntilDue === 0 ? "今天" : `${item.daysUntilDue} 天后`}）`}
                    </span>
                    {item.prepHint && <p>{item.prepHint}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.nextStep && (
            <p className="ai-summary-next">
              <strong>下一步：</strong>
              {report.nextStep}
            </p>
          )}

          <button
            className="text-button"
            type="button"
            onClick={() => setReport(null)}
          >
            关闭
          </button>
        </div>
      )}
    </section>
  );
}
