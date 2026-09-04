import { useState } from "react";

export default function DeleteIssueButton({ issueTitle, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="delete-confirmation" role="group" aria-label="确认删除">
        <span>确定删除“{issueTitle}”吗？</span>
        <div>
          <button
            className="button button-ghost button-small"
            type="button"
            onClick={() => setConfirming(false)}
          >
            取消
          </button>
          <button
            className="button button-danger button-small"
            type="button"
            onClick={onDelete}
          >
            确认删除
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className="button button-danger"
      type="button"
      onClick={() => setConfirming(true)}
    >
      删除任务
    </button>
  );
}
