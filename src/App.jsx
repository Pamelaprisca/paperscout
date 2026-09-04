import { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router";
import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import { seedIssues } from "./data/seedIssues.js";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { useTheme } from "./hooks/useTheme.js";
import BoardPage from "./pages/BoardPage.jsx";
import EditIssuePage from "./pages/EditIssuePage.jsx";
import IssueDetailsPage from "./pages/IssueDetailsPage.jsx";
import NewIssuePage from "./pages/NewIssuePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { getNextIssueId } from "./utils/issues.js";

const OLD_ENGLISH_SEED_TITLES = new Set([
  "Fix mobile navigation overlap",
  "Add useful empty states",
  "Keyboard shortcut for new issue",
  "Improve issue search",
  "Polish issue details layout",
  "Add behavior tests for edit flow",
]);

export default function App() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [issues, setIssues] = useLocalStorage(
    "tinyboard:issues:v5",
    seedIssues,
  );
  const [toast, setToast] = useState("");

  useEffect(() => {
    setIssues((currentIssues) => {
      if (
        Array.isArray(currentIssues) &&
        currentIssues.some((issue) => OLD_ENGLISH_SEED_TITLES.has(issue.title))
      ) {
        return seedIssues;
      }
      return currentIssues;
    });
  }, [setIssues]);

  useKeyboardShortcut("n", () => {
    navigate("/issues/new");
  });

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => {
      setToast("");
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  function createIssue(formData) {
    const now = new Date().toISOString();
    const newIssue = {
      id: getNextIssueId(issues),
      ...formData,
      status: "todo",
      createdAt: now,
      updatedAt: now,
    };

    setIssues((currentIssues) => [
      newIssue,
      ...currentIssues,
    ]);
    setToast("任务已创建");

    return newIssue;
  }

  function updateIssue(issueId, formData) {
    const updatedAt = new Date().toISOString();

    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              ...formData,
              updatedAt,
            }
          : issue,
      ),
    );

    setToast("修改已保存");
  }

  function deleteIssue(issueId) {
    setIssues((currentIssues) =>
      currentIssues.filter((issue) => issue.id !== issueId),
    );
    setToast("任务已删除");
  }

  function changeIssueStatus(issueId, status) {
    const updatedAt = new Date().toISOString();

    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === issueId
          ? { ...issue, status, updatedAt }
          : issue,
      ),
    );

    setToast("状态已更新");
  }

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onThemeToggle={toggleTheme}
        onDelete={deleteIssue}
      />

      <Routes>
        <Route
          path="/"
          element={
            <BoardPage
              issues={issues}
              onStatusChange={changeIssueStatus}
            />
          }
        />
        <Route
          path="/issues/new"
          element={<NewIssuePage onCreate={createIssue} />}
        />
        <Route
          path="/issues/:issueId"
          element={
            <IssueDetailsPage
              issues={issues}
              onDelete={deleteIssue}
              onStatusChange={changeIssueStatus}
            />
          }
        />
        <Route
          path="/issues/:issueId/edit"
          element={
            <EditIssuePage
              issues={issues}
              onUpdate={updateIssue}
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toast message={toast} />
    </div>
  );
}
