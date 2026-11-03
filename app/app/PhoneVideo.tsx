"use client";

import { useEffect, useRef } from "react";

type PhoneVideoProps = {
  name: string;
  label: string;
};

/** A recording of the app in a phone. It plays only while on screen, and not at all when motion is reduced. */
export default function PhoneVideo({ name, label }: PhoneVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="ap-phone">
      <video
        ref={ref}
        className="ap-screen"
        src={`/app/${name}.mp4`}
        poster={`/app/${name}.webp`}
        aria-label={label}
        width={1080}
        height={1920}
        muted
        loop
        playsInline
        preload="none"
      />
    </div>
  );
}
