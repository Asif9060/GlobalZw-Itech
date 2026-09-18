"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, READY_EVENT, ScrollTrigger } from "@/lib/gsap";

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const numEl = numRef.current;
    const barEl = barRef.current;
    if (!root) return;

    const counter = { v: 0 };
    let timeline: gsap.core.Timeline | null = null;

    const tween = gsap.to(counter, {
      v: 100,
      duration: 2.2,
      ease: "power2.inOut",
      onUpdate() {
        if (numEl) {
          numEl.textContent = String(Math.floor(counter.v));
        }
        if (barEl) {
          barEl.style.width = counter.v + "%";
        }
      },
      onComplete() {
        timeline = gsap.timeline();
        timeline
          .to(root.querySelectorAll(".pre-sun, .pre-count, .pre-brand"), {
            opacity: 0,
            y: -30,
            duration: 0.5,
            stagger: 0.08,
          })
          .to(root, { yPercent: -100, duration: 1, ease: "power4.inOut" }, "-=.15")
          .add(() => {
            document.body.classList.remove("loading");
            setHidden(true);
            window.dispatchEvent(new Event(READY_EVENT));
            ScrollTrigger.refresh();
          });
      },
    });

    return () => {
      tween.kill();
      timeline?.kill();
      counter.v = 0;
      if (numEl) numEl.textContent = "0";
      if (barEl) barEl.style.width = "0%";
    };
  }, []);

  return (
    <div
      id="preloader"
      ref={rootRef}
      style={hidden ? { display: "none" } : undefined}
    >
      <div className="pre-brand">SOLARIS ENERGY</div>
      <div className="pre-sun">
        <div className="ring"></div>
        <div className="core"></div>
        <div className="panelbar">
          <i ref={barRef} id="preBar"></i>
        </div>
      </div>
      <div className="pre-count">
        <span ref={numRef} id="preNum">
          0
        </span>
        % &nbsp;·&nbsp; CHARGING UP THE SUN
      </div>
    </div>
  );
}
