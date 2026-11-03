"use client";

import { useEffect } from "react";

/**
 * Fades each [data-reveal] part up once, over a set time, when it first comes into view, so nothing is ever
 * left half-faded where the reader stops scrolling. What is already on screen when the page opens simply
 * shows, and nothing moves for those who ask for less motion.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".app-page");
    if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const parts = [...page.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
      (part) => part.getBoundingClientRect().top > window.innerHeight
    );
    for (const part of parts) part.classList.add("ap-pending");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove("ap-pending");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    for (const part of parts) observer.observe(part);
    return () => observer.disconnect();
  }, []);

  return null;
}
