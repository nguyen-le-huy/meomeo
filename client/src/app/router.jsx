import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout.jsx";
import ProtectedRoute from "../features/auth/components/ProtectedRoute.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import DashboardPage from "../features/dashboard/pages/DashboardPage.jsx";
import VocabularyPage from "../features/vocabulary/pages/VocabularyPage.jsx";
import GrammarPage from "../features/grammar/pages/GrammarPage.jsx";
import ExercisePage from "../features/exercises/pages/ExercisePage.jsx";
import ToeicDictationPage from "../features/exercises/pages/ToeicDictationPage.jsx";
import SpeechPracticePage from "../features/speech/pages/SpeechPracticePage.jsx";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage.jsx";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        element: <ProtectedRoute allowedRoles={["admin", "student"]} />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "vocabulary", element: <VocabularyPage /> },
          { path: "grammar", element: <GrammarPage /> },
          { path: "exercises", element: <ExercisePage /> },
          { path: "toeic-dictation", element: <ToeicDictationPage /> },
          { path: "speech", element: <SpeechPracticePage /> },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [{ path: "admin", element: <AdminDashboardPage /> }],
      },
    ],
  },
]);
