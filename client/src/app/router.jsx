import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import VideoLearningPage from "../features/videos/pages/VideoLearningPage.jsx";
import VideoLibraryPage from "../features/videos/pages/VideoLibraryPage.jsx";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <VideoLibraryPage /> },
      { path: "videos/:id", element: <VideoLearningPage /> },
      { path: "videos/:id/dictation", element: <VideoLearningPage /> },
      { path: "admin", element: <Navigate to="/" replace /> },
      { path: "admin/*", element: <Navigate to="/" replace /> },
    ],
  },
]);
