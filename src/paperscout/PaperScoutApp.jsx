import { Navigate, Route, Routes } from "react-router";

import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { AppShell } from "./layout/AppShell.jsx";
import AgentPage from "./pages/AgentPage.jsx";
import CollectionPage from "./pages/CollectionPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DiscoverPage from "./pages/DiscoverPage.jsx";
import PaperDetailPage from "./pages/PaperDetailPage.jsx";

export default function PaperScoutApp() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="papers/:paperId" element={<PaperDetailPage />} />
            <Route path="collections/:collectionId" element={<CollectionPage />} />
            <Route path="agent" element={<AgentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
}
