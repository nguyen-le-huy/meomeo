export default function DashboardPage() {
  return (
    <section className="relative h-full overflow-hidden bg-matcha">
      <img
        alt="Mèo cầm cốc cà phê"
        className="pointer-events-none absolute left-8 top-6 z-10 h-[150px] w-[150px] object-contain sm:left-14 sm:top-5 sm:h-[190px] sm:w-[190px]"
        src="https://res.cloudinary.com/dknin0hhf/image/upload/v1781605588/In_Love_Latte_Sticker_stfcmf.gif"
      />

      <img
        alt="Mèo nhảy"
        className="pointer-events-none absolute right-10 top-8 z-10 h-[126px] w-[126px] object-contain sm:right-16 sm:top-10 sm:h-[168px] sm:w-[168px]"
        src="https://res.cloudinary.com/dknin0hhf/image/upload/v1781605588/Cat_Dancing_Sticker_ym40gn.gif"
      />

      <div className="relative z-20 flex h-full flex-col items-center px-6 pt-[24vh] text-center sm:pt-[27vh]">
        <h1 className="text-[30px] font-black leading-tight text-black sm:text-[38px]">
          meo meo chào buổi sáng nhé
        </h1>
      </div>

      <video
        autoPlay
        className="absolute bottom-0 left-1/2 z-10 max-h-[78vh] w-[118vw] max-w-[880px] -translate-x-1/2 object-contain sm:max-h-[82vh] sm:w-[92vw] sm:max-w-[1080px]"
        loop
        muted
        playsInline
        src="https://res.cloudinary.com/dknin0hhf/video/upload/v1781603836/cat_tdv7xe.webm"
      />
    </section>
  );
}
