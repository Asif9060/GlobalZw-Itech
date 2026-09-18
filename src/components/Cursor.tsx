"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const HOVER_SELECTOR = "a,button,.svc-card,.case-card,input,select,textarea";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    const onMove = (event: MouseEvent) => {
      dotX(event.clientX - 3.5);
      dotY(event.clientY - 3.5);
      ringX(event.clientX - 19);
      ringY(event.clientY - 19);
    };

    const onEnter = () =>
      gsap.to(ring, {
        scale: 1.5,
        borderColor: "rgba(255,183,3,.9)",
        duration: 0.3,
      });
    const onLeave = () =>
      gsap.to(ring, {
        scale: 1,
        borderColor: "rgba(255,183,3,.55)",
        duration: 0.3,
      });

    window.addEventListener("mousemove", onMove);
    const targets = document.querySelectorAll(HOVER_SELECTOR);
    targets.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <>
      <div className="cur-dot" ref={dotRef}></div>
      <div className="cur-ring" ref={ringRef}></div>
    </>
  );
}
