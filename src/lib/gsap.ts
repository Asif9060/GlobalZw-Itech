"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

// Plugins only exist in the browser; the server render must not touch them.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

/** Dispatched by the preloader once the site is revealed. */
export const READY_EVENT = "solaris:ready";

/** Counts an element up to its `data-count`, appending `data-suffix`. */
export function animateCount(el: Element, delay = 0) {
  const target = parseFloat((el as HTMLElement).dataset.count || "0");
  const suffix = (el as HTMLElement).dataset.suffix || "";
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target,
    duration: 2.1,
    delay,
    ease: "power2.out",
    onUpdate() {
      el.textContent = Math.floor(obj.v).toLocaleString() + suffix;
    },
    onComplete() {
      el.textContent =
        (target % 1 === 0 ? target.toLocaleString() : target) + suffix;
    },
  });
}

export { gsap, ScrollTrigger, ScrollToPlugin };
