"use client";

import { useSmoothScroll } from "@/components/SmoothScrollProvider";

export default function BackToTop() {
  const { scrollTo } = useSmoothScroll();
  return (
    <button
      id="toTop"
      aria-label="Back to top"
      onClick={() => scrollTo(0, { duration: 1.6 })}
    >
      ↑
    </button>
  );
}
