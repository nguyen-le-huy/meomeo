import { AlertTriangle, Info, Play, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import AddMovieDialog from "../components/AddMovieDialog.jsx";
import ManageMovieHeroDialog from "../components/ManageMovieHeroDialog.jsx";
import MovieRow from "../components/MovieRow.jsx";
import { movies as demoMovies } from "../data/netflixMockData.js";
import { useMovieAdminMutations, useMovieLibrary } from "../hooks/useMovies.js";
import { flattenMovieLibrary, normalizeMovie } from "../utils/movieData.js";
import { uploadMovieFile } from "../utils/tusMovieUpload.js";
import { syncStreamStatus } from "../services/movieApi.js";
import "../styles/netflix-chill.css";

export default function NetflixChillPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [adminError, setAdminError] = useState("");
  const libraryQuery = useMovieLibrary(
    { includeUnpublished: isAdmin || undefined },
    { refetchInterval: isAdmin ? 5000 : false },
  );
  const refetchLibrary = libraryQuery.refetch;
  const movieMutations = useMovieAdminMutations();
  const apiMovies = useMemo(() => flattenMovieLibrary(libraryQuery.data), [libraryQuery.data]);
  const isOfflineDemo = libraryQuery.isError;
  const allMovies = isOfflineDemo ? demoMovies : apiMovies;
  const visibleMovies = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    if (!term) return allMovies;
    return allMovies.filter((movie) => `${movie.title} ${movie.description || ""}`.toLocaleLowerCase("vi").includes(term));
  }, [allMovies, search]);
  const featuredMovie = normalizeMovie(libraryQuery.data?.featuredMovie) || visibleMovies[0] || null;

  useEffect(() => {
    const processingIds = apiMovies
      .filter((movie) => movie.streamStatus === "processing" || (movie.streamStatus === "uploading" && movie.uploadProgress >= 100))
      .map((movie) => movie.id);
    if (!isAdmin || !processingIds.length) return undefined;
    const interval = window.setInterval(async () => {
      await Promise.allSettled(processingIds.map((id) => syncStreamStatus(id)));
      refetchLibrary();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [apiMovies, isAdmin, refetchLibrary]);

  function openPlayer(movie) {
    navigate(`/netflix/${movie.id || movie._id}`);
  }

  async function resumeUpload(movie, file, onProgress) {
    await uploadMovieFile({ file, movieId: movie.id, onProgress, title: movie.title });
    await libraryQuery.refetch();
  }

  async function deleteMovie(movie) {
    const confirmed = window.confirm(`Xóa vĩnh viễn "${movie.title}" cùng video trên Bunny và toàn bộ ảnh? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;
    setDeletingId(movie.id);
    setAdminError("");
    try {
      await movieMutations.remove.mutateAsync({ id: movie.id, deleteAsset: true });
    } catch (error) {
      setAdminError(error.response?.data?.message || "Không thể xóa phim");
    } finally {
      setDeletingId("");
    }
  }

  if (libraryQuery.isLoading) {
    return <div className="grid min-h-[70vh] place-items-center bg-[#111] text-white"><LoadingState label="Đang tải thư viện phim..." /></div>;
  }

  return (
    <div className="netflix-chill min-h-screen overflow-x-hidden bg-[#111] text-white">
      {featuredMovie ? (
        <section className="relative h-[68dvh] min-h-[520px] max-h-[780px]" aria-labelledby="featured-movie-title">
          <img alt="" className="absolute inset-0 h-full w-full object-cover object-center" src={featuredMovie.backdrop} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-black/5" />
          <div className="absolute inset-x-0 top-[42%] mx-auto max-w-[1720px] -translate-y-1/2 px-4 sm:px-6 lg:px-10">
            <div className="max-w-xl">
              <h1 className="max-w-[12ch] text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.92] text-white" id="featured-movie-title">{featuredMovie.title}</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/90 sm:text-lg sm:leading-7">{featuredMovie.description}</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-base font-bold text-black transition hover:bg-white/80" onClick={() => openPlayer(featuredMovie)} type="button"><Play fill="currentColor" size={20} /> Xem ngay</button>
                <button className="inline-flex h-12 items-center gap-2 rounded-md bg-[#6d6d6e]/80 px-5 text-base font-bold text-white transition hover:bg-[#6d6d6e]/60" onClick={() => openPlayer(featuredMovie)} type="button"><Info size={21} /> Thông tin</button>
              </div>
            </div>
          </div>
          {isAdmin && !isOfflineDemo ? (
            <div className="absolute right-4 top-5 z-20 sm:right-6 lg:right-10">
              <ManageMovieHeroDialog featuredMovie={featuredMovie} movies={allMovies} mutation={movieMutations.setHero} />
            </div>
          ) : null}
        </section>
      ) : <div className="h-24" />}

      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-3 px-4 pt-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <label className="relative block w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input aria-label="Tìm phim" className="h-11 w-full rounded-md border border-white/15 bg-white/[0.06] pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/40" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên phim..." value={search} />
        </label>
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            {!featuredMovie && !isOfflineDemo ? <ManageMovieHeroDialog featuredMovie={null} movies={allMovies} mutation={movieMutations.setHero} /> : null}
            <AddMovieDialog createMutation={movieMutations.create} onCreated={(movie) => navigate(`/netflix/${movie._id}`)} />
          </div>
        ) : null}
      </div>

      {isOfflineDemo ? (
        <div className="mx-auto mt-4 flex max-w-[1720px] items-center gap-2 px-4 text-xs text-amber-300/80 sm:px-6 lg:px-10"><AlertTriangle size={15} /> API phim chưa sẵn sàng, đang hiển thị dữ liệu demo.</div>
      ) : null}

      {adminError ? <div className="mx-auto mt-4 max-w-[1720px] px-4 text-sm text-red-300 sm:px-6 lg:px-10">{adminError}</div> : null}

      {visibleMovies.length ? (
        <MovieRow
          deletingId={deletingId}
          editMutation={movieMutations.update}
          isAdmin={isAdmin}
          movies={visibleMovies}
          onDelete={deleteMovie}
          onResume={resumeUpload}
          onSelect={openPlayer}
          title="Tất cả"
        />
      ) : (
        <div className="mx-auto max-w-[1720px] px-4 py-20 text-center sm:px-6 lg:px-10">
          <p className="text-xl font-semibold">{search ? "Không tìm thấy phim phù hợp" : "Chưa có phim sẵn sàng"}</p>
          <p className="mt-2 text-sm text-white/45">{isAdmin ? "Tạo draft, upload video và import phụ đề English để publish phim đầu tiên." : "Nội dung mới sẽ xuất hiện tại đây sau khi hoàn tất xử lý."}</p>
          {search ? <Button className="mt-4 border-white/20 bg-transparent text-white" onClick={() => setSearch("")} variant="outline">Xóa tìm kiếm</Button> : null}
        </div>
      )}

      {isAdmin && libraryQuery.data?.counts ? (
        <section className="mx-auto max-w-[1720px] px-4 pb-12 sm:px-6 lg:px-10">
          <h2 className="mb-3 text-sm font-semibold text-white/65">Trạng thái thư viện (Admin)</h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">{libraryQuery.data.counts.public} public</span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">{libraryQuery.data.counts.total} tổng</span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">{libraryQuery.data.counts.processing} đang xử lý</span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">{libraryQuery.data.counts.failed} lỗi</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
