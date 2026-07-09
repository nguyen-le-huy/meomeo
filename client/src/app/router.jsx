import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout.jsx";
import ProtectedRoute from "../features/auth/components/ProtectedRoute.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import VideoLearningPage from "../features/videos/pages/VideoLearningPage.jsx";
import VideoLibraryPage from "../features/videos/pages/VideoLibraryPage.jsx";
import TopicVideosPage from "../features/videos/pages/TopicVideosPage.jsx";
import BilingualWatchPage from "../features/bilingual/pages/BilingualWatchPage.jsx";
import AdminReadingsPage from "../features/reading/pages/AdminReadingsPage.jsx";
import ReadingPracticePage from "../features/reading/pages/ReadingPracticePage.jsx";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <VideoLibraryPage /> },
      { path: "reading/:slug", element: <ReadingPracticePage /> },
      { path: "topics/:slug", element: <TopicVideosPage /> },
      { path: "videos/:id", element: <VideoLearningPage /> },
      { path: "videos/:id/dictation", element: <VideoLearningPage /> },
      { path: "videos/:id/bilingual", element: <BilingualWatchPage /> },
      {
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [
          { path: "admin/readings", element: <AdminReadingsPage /> },
        ],
      },
      { path: "admin", element: <Navigate to="/admin/readings" replace /> },
      { path: "admin/*", element: <Navigate to="/admin/readings" replace /> },
    ],
  },
]);
