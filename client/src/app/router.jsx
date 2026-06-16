import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout.jsx";
import ProtectedRoute from "../features/auth/components/ProtectedRoute.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import AdminVocabularyCourseCreatePage from "../features/admin/vocabulary-courses/pages/AdminVocabularyCourseCreatePage.jsx";
import AdminVocabularyCourseEditPage from "../features/admin/vocabulary-courses/pages/AdminVocabularyCourseEditPage.jsx";
import AdminVocabularyCourseListPage from "../features/admin/vocabulary-courses/pages/AdminVocabularyCourseListPage.jsx";
import AdminVocabularyImportJsonPage from "../features/admin/vocabulary/pages/AdminVocabularyImportJsonPage.jsx";
import AdminVocabularyItemCreatePage from "../features/admin/vocabulary/pages/AdminVocabularyItemCreatePage.jsx";
import AdminVocabularyItemEditPage from "../features/admin/vocabulary/pages/AdminVocabularyItemEditPage.jsx";
import AdminVocabularyItemPage from "../features/admin/vocabulary/pages/AdminVocabularyItemPage.jsx";
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
      { path: "dashboard", element: <Navigate to="/" replace /> },
      { path: "vocabulary", element: <Navigate to="/" replace /> },
      { path: "grammar", element: <Navigate to="/" replace /> },
      { path: "exercises", element: <Navigate to="/" replace /> },
      { path: "toeic-dictation", element: <Navigate to="/" replace /> },
      { path: "speech", element: <Navigate to="/" replace /> },
      {
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [
          { path: "admin", element: <Navigate to="/" replace /> },
          { path: "admin/vocabulary-courses", element: <AdminVocabularyCourseListPage /> },
          {
            path: "admin/vocabulary-courses/create",
            element: <AdminVocabularyCourseCreatePage />,
          },
          {
            path: "admin/vocabulary-courses/:id/edit",
            element: <AdminVocabularyCourseEditPage />,
          },
          {
            path: "admin/vocabulary-courses/:courseId/items",
            element: <AdminVocabularyItemPage />,
          },
          {
            path: "admin/vocabulary-courses/:courseId/items/create",
            element: <AdminVocabularyItemCreatePage />,
          },
          {
            path: "admin/vocabulary-courses/:courseId/items/import-json",
            element: <AdminVocabularyImportJsonPage />,
          },
          {
            path: "admin/vocabulary-items/:itemId/edit",
            element: <AdminVocabularyItemEditPage />,
          },
        ],
      },
    ],
  },
]);
