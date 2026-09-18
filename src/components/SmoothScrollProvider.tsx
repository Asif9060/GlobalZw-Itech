"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type Lenis from "@studio-freight/lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type ScrollTarget = number | string | HTMLElement | null;
type ScrollToOptions = { offset?: number; duration?: number };

type SmoothScrollApi = {
  scrollTo: (target: ScrollTarget, options?: ScrollToOptions) => void;
};

const SmoothScrollContext = createContext<SmoothScrollApi>({
  scrollTo: () => {},
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

export default function SmoothScrollProvider({
  children,
}: {
  children: ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Keep a handle so the ticker callback can reach the instance lazily.
    const raf = (time: number) => lenisRef.current?.raf(time * 1000);

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    (async () => {
      const { default: LenisCtor } = await import("@studio-freight/lenis");
      if (cancelled) return;
      const lenis = new LenisCtor({
        duration: 1.15,
        smoothWheel: true,
        wheelMultiplier: 0.95,
      });
      lenis.on("scroll", ScrollTrigger.update);
      lenisRef.current = lenis;
    })();

    return () => {
      cancelled = true;
      gsap.ticker.remove(raf);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback((target: ScrollTarget, options?: ScrollToOptions) => {
    if (target === null || target === undefined) return;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, options);
      return;
    }
    // Before Lenis boots (or if it never does) fall back to native scrolling.
    if (typeof target === "number") {
      window.scrollTo({ top: target });
    } else if (typeof target === "string") {
      document.querySelector(target)?.scrollIntoView();
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView();
    }
  }, []);

  const value = useMemo(() => ({ scrollTo }), [scrollTo]);

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
