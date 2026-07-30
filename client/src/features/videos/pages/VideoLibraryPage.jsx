import VideoLibraryContent from "../components/VideoLibraryContent.jsx";

export default function VideoLibraryPage({ showCategoryList = true, title = "Học qua Youtube" }) {
  return (
    <section className="min-h-full overflow-auto bg-canvas text-coal">
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-10 lg:pt-12">
        <VideoLibraryContent showCategoryList={showCategoryList} title={title} />
      </div>
    </section>
  );
}
