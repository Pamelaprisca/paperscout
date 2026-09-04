import { useEffect, useRef, useState } from "react";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  parseTags,
} from "../utils/issues.js";
import { parseDateFromText } from "../utils/date.js";

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assignee: "",
  tags: "",
  dueDate: "",
};

function toFormValue(issue) {
  if (!issue) return EMPTY_FORM;

  return {
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
    assignee: issue.assignee ?? "",
    tags: issue.tags.join(", "),
    dueDate: issue.dueDate ?? "",
  };
}

function validate(form) {
  const errors = {};

  if (form.title.trim().length < 3) {
    errors.title = "标题至少需要 3 个字，便于识别任务。";
  }

  if (form.description.trim().length < 10) {
    errors.description = "请补充更多上下文，至少 10 个字。";
  }

  if (form.assignee.trim().length === 1) {
    errors.assignee = "请填写完整姓名，或保持负责人为空。";
  }

  return errors;
}

export default function IssueForm({
  initialIssue,
  onSubmit,
  submitLabel = "保存任务",
  showStatus = true,
}) {
  const [form, setForm] = useState(() => toFormValue(initialIssue));
  const [errors, setErrors] = useState({});
  const submitTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(submitTimerRef.current);
  }, []);

  function updateField(name, value) {
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [name]: value };

      if (name === "description") {
        const parsedDate = parseDateFromText(value);
        if (parsedDate) {
          nextForm.dueDate = parsedDate;
        }
      }

      return nextForm;
    });

    if (errors[name]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: "",
      }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (
      nextErrors.title ||
      nextErrors.description ||
      nextErrors.assignee
    ) {
      return;
    }

    clearTimeout(submitTimerRef.current);
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      assignee: form.assignee.trim(),
      tags: parseTags(form.tags),
      dueDate: form.dueDate,
    };

    // 180ms 防抖：快速连点只提交一次
    submitTimerRef.current = window.setTimeout(() => {
      onSubmit(data);
    }, 180);
  }

  return (
    <form className="issue-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="field field-full">
          <label htmlFor="issue-title">标题</label>
          <input
            id="issue-title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="例如：修复移动端导航栏重叠"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
            autoFocus
          />
          {errors.title && (
            <small className="field-error" id="title-error" role="alert">
              {errors.title}
            </small>
          )}
        </div>

        <div className="field field-full">
          <label htmlFor="issue-description">描述</label>
          <textarea
            id="issue-description"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="描述发生了什么，以及希望改成什么效果。"
            rows="6"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {errors.description && (
            <small className="field-error" id="description-error" role="alert">
              {errors.description}
            </small>
          )}
        </div>

        {showStatus && (
          <div className="field">
            <label htmlFor="issue-status">状态</label>
            <select
              id="issue-status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="issue-priority">优先级</label>
          <select
            id="issue-priority"
            value={form.priority}
            onChange={(event) => updateField("priority", event.target.value)}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="issue-assignee">负责人</label>
          <input
            id="issue-assignee"
            value={form.assignee}
            onChange={(event) => updateField("assignee", event.target.value)}
            placeholder="例如：Mia"
            aria-invalid={Boolean(errors.assignee)}
            aria-describedby={errors.assignee ? "assignee-error" : undefined}
          />
          {errors.assignee && (
            <small className="field-error" id="assignee-error" role="alert">
              {errors.assignee}
            </small>
          )}
        </div>

        <div className="field">
          <label htmlFor="issue-due-date">截止日期</label>
          <input
            id="issue-due-date"
            type="date"
            value={form.dueDate}
            onChange={(event) => updateField("dueDate", event.target.value)}
          />
        </div>

        <div className="field field-full">
          <label htmlFor="issue-tags">Tags</label>
          <input
            id="issue-tags"
            value={form.tags}
            onChange={(event) => updateField("tags", event.target.value)}
            placeholder="前端, bug, 响应式"
          />
          <small className="field-hint">多个标签用英文逗号分隔。</small>
        </div>
      </div>

      <div className="form-actions">
        <button className="button button-primary" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
