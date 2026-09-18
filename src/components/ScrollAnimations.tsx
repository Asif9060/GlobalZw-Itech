"use client";

import { useEffect } from "react";
import { animateCount, gsap, READY_EVENT, ScrollTrigger } from "@/lib/gsap";

const NAV_SECTIONS = [
  "about",
  "services",
  "calculator",
  "projects",
  "process",
  "contact",
];

export default function ScrollAnimations() {
  useEffect(() => {
    const headerEl = document.getElementById("header");
    const toTopEl = document.getElementById("toTop");

    const ctx = gsap.context(() => {
      /* ---------- HEADER / PROGRESS ---------- */
      ScrollTrigger.create({
        start: 40,
        end: "max",
        onUpdate: (self) => {
          headerEl?.classList.toggle("scrolled", self.scroll() > 40);
        },
      });

      gsap.to("#scrollProgress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
      });

      ScrollTrigger.create({
        start: 600,
        end: "max",
        onUpdate: (self) => {
          toTopEl?.classList.toggle("show", self.scroll() > 600);
        },
      });

      /* nav active states */
      NAV_SECTIONS.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        ScrollTrigger.create({
          trigger: section,
          start: "top 40%",
          end: "bottom 40%",
          onToggle: (self) => {
            if (!self.isActive) return;
            document.querySelectorAll("nav.mainnav a").forEach((link) => {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + id,
              );
            });
          },
        });
      });

      /* ---------- GENERIC REVEALS ---------- */
      gsap.utils.toArray<HTMLElement>(".rv").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 87%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".rv-l").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          x: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 87%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".rv-r").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          x: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 87%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".rv-s").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(2)",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      /* line-mask titles */
      gsap.utils.toArray<HTMLElement>(".mask-title").forEach((title) => {
        const innerLines = title.querySelectorAll(".lm > i");
        gsap.to(innerLines, {
          y: 0,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.12,
          scrollTrigger: { trigger: title, start: "top 85%", once: true },
        });
      });

      /* ---------- COUNTERS ---------- */
      gsap.utils
        .toArray<HTMLElement>("[data-count]:not(#heroStats [data-count])")
        .forEach((el) => {
          ScrollTrigger.create({
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () => animateCount(el),
          });
        });

      /* ---------- PROCESS TIMELINE LINE ---------- */
      gsap.to("#procFill", {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".proc-wrap",
          start: "top 65%",
          end: "bottom 75%",
          scrub: 0.5,
        },
      });

      /* ---------- FOOTER REVEAL ---------- */
      gsap.from("footer .foot-col, footer .foot-brand", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: "footer", start: "top 92%", once: true },
      });
    });

    /* ---------- SERVICE CARD 3D TILT ---------- */
    const tiltCards = Array.from(document.querySelectorAll<HTMLElement>(".tilt"));
    const tiltHandlers = tiltCards.map((card) => {
      const onMove = (event: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const rx = (event.clientX - rect.left) / rect.width;
        const ry = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--mx", rx * 100 + "%");
        card.style.setProperty("--my", ry * 100 + "%");
        gsap.to(card, {
          rotationY: (rx - 0.5) * 9,
          rotationX: (0.5 - ry) * 9,
          transformPerspective: 900,
          duration: 0.5,
          ease: "power2.out",
        });
      };
      const onLeave = () => {
        gsap.to(card, {
          rotationY: 0,
          rotationX: 0,
          duration: 0.7,
          ease: "elastic.out(1,.5)",
        });
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      return { card, onMove, onLeave };
    });

    /* ---------- refresh after the preloader / fonts settle ---------- */
    const onReady = () => ScrollTrigger.refresh();
    window.addEventListener(READY_EVENT, onReady);
    const refreshOnLoad = () => setTimeout(() => ScrollTrigger.refresh(), 300);
    if (document.readyState === "complete") {
      refreshOnLoad();
    } else {
      window.addEventListener("load", refreshOnLoad);
    }

    return () => {
      ctx.revert();
      tiltHandlers.forEach(({ card, onMove, onLeave }) => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
      window.removeEventListener(READY_EVENT, onReady);
      window.removeEventListener("load", refreshOnLoad);
    };
  }, []);

  return <div id="scrollProgress"></div>;
}
