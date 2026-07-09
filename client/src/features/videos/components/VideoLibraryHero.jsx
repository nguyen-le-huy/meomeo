import { useEffect, useState } from "react";

import { heroCatUrl, practiceCatUrl } from "../constants/videoLibrary.constants.js";

function getGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 4 && hour < 12) return "chào buổi sáng";
  if (hour >= 12 && hour < 14) return "chào buổi trưa";
  if (hour >= 14 && hour < 18) return "chào buổi chiều";
  if (hour >= 18) return "chào buổi tối";

  return "chào buổi đêm";
}

export default function VideoLibraryHero() {
  const [greeting, setGreeting] = useState(() => getGreeting());

  useEffect(() => {
    const updateGreeting = () => setGreeting(getGreeting());
    const intervalId = window.setInterval(updateGreeting, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="grid gap-5 overflow-hidden border-b border-[#e6dfd8] pb-4 pt-8 sm:gap-7 sm:pb-8 sm:pt-12 lg:min-h-[340px] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:items-center lg:gap-10 lg:overflow-visible lg:pb-14 lg:pt-4">
      <div className="max-w-3xl">
        <h1 className="display-heading max-w-[340px] text-[30px] leading-[0.96] tracking-normal sm:max-w-xl sm:text-5xl lg:max-w-none lg:text-[56px] lg:leading-[0.96] xl:text-[64px]">
          meo meo {greeting}<br />Vào học ngay cho tớ.
        </h1>
        <p className="mt-2 max-w-xl text-sm font-semibold leading-5 text-ink-body sm:mt-6 sm:text-base sm:leading-7">
          Chịu khó học vào con ranh này
        </p>
      </div>
      <div className="flex items-end justify-between gap-3 overflow-hidden sm:gap-5 lg:justify-end lg:gap-4 lg:overflow-visible">
        <img
          alt=""
          aria-hidden="true"
          className="h-[112px] w-auto max-w-none object-contain sm:h-[190px] lg:h-60 xl:h-64"
          src={heroCatUrl}
        />
        <img
          alt=""
          aria-hidden="true"
          className="h-[112px] w-auto max-w-none object-contain sm:h-[182px] lg:h-56 xl:h-60"
          src={practiceCatUrl}
        />
      </div>
    </div>
  );
}
