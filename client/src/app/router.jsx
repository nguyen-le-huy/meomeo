import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout.jsx";
import ScrollToTop from "../components/layout/ScrollToTop.jsx";
import ProtectedRoute from "../features/auth/components/ProtectedRoute.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import HomePage from "../features/home/pages/HomePage.jsx";
import VideoLearningPage from "../features/videos/pages/VideoLearningPage.jsx";
import VideoLibraryPage from "../features/videos/pages/VideoLibraryPage.jsx";
import TopicVideosPage from "../features/videos/pages/TopicVideosPage.jsx";
import BilingualWatchPage from "../features/bilingual/pages/BilingualWatchPage.jsx";
import EbookLibraryPage from "../features/ebooks/pages/EbookLibraryPage.jsx";
import EbookReaderPage from "../features/ebooks/pages/EbookReaderPage.jsx";
import AdminEbooksPage from "../features/ebooks/pages/AdminEbooksPage.jsx";
import DictionaryHistoryPage from "../features/dictionary/pages/DictionaryHistoryPage.jsx";
import VocabularyDailyPage from "../features/vocabulary/pages/VocabularyDailyPage.jsx";
import VocabularyDayPathPage from "../features/vocabulary/pages/VocabularyDayPathPage.jsx";
import VocabularyLessonPage from "../features/vocabulary/pages/VocabularyLessonPage.jsx";
import AdminVocabularyPage from "../features/vocabulary/pages/AdminVocabularyPage.jsx";
import NetflixChillPage from "../features/movies/pages/NetflixChillPage.jsx";
import MoviePlayerPage from "../features/movies/pages/MoviePlayerPage.jsx";

function RouteShell() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RouteShell />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "youtube", element: <VideoLibraryPage /> },
          { path: "netflix", element: <NetflixChillPage /> },
          { path: "netflix/:movieId", element: <MoviePlayerPage /> },
          { path: "movies", element: <NetflixChillPage /> },
          { path: "movies/:movieId", element: <MoviePlayerPage /> },
          { path: "vocabulary", element: <VocabularyDailyPage /> },
          { path: "vocabulary/:dayId", element: <VocabularyDayPathPage /> },
          { path: "vocabulary/:dayId/:lessonId", element: <VocabularyLessonPage /> },
          { path: "ebooks", element: <EbookLibraryPage /> },
          { path: "dictionary/history", element: <DictionaryHistoryPage /> },
          { path: "ebooks/:slug", element: <EbookReaderPage /> },
          { path: "topics/:slug", element: <TopicVideosPage /> },
          { path: "videos/:id", element: <VideoLearningPage /> },
          { path: "videos/:id/dictation", element: <VideoLearningPage /> },
          { path: "videos/:id/bilingual", element: <BilingualWatchPage /> },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [
              { path: "admin/ebooks", element: <AdminEbooksPage /> },
              { path: "admin/vocabulary", element: <AdminVocabularyPage /> },
            ],
          },
          { path: "admin", element: <Navigate to="/" replace /> },
          { path: "admin/*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
