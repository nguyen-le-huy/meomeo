import MoviePosterCard from "./MoviePosterCard.jsx";

export default function MovieRow({ deletingId, editMutation, isAdmin, movies, onDelete, onResume, onSelect, title }) {
  if (!movies.length) return null;

  return (
    <section className="mx-auto w-full max-w-[1720px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10" aria-labelledby={`row-${title.replace(/\s/g, "-")}`}>
      <h2 className="mb-4 text-xl font-semibold text-white sm:text-2xl" id={`row-${title.replace(/\s/g, "-")}`}>
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-9">
        {movies.map((movie) => (
          <MoviePosterCard
            editMutation={editMutation}
            isAdmin={isAdmin}
            isDeleting={deletingId === movie.id}
            key={movie.id}
            movie={movie}
            onDelete={onDelete}
            onResume={onResume}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
