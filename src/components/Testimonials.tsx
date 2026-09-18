"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const TESTIMONIALS = [
  {
    q: "The system is incredibly advanced and user-friendly, ensuring a stable electricity supply. Previously, power outages occurred frequently — now everything runs smoothly. We are installing this system in three more villages.",
    n: "Grace M.",
    r: "Rural Electrification Program · Zambia",
    i: "GM",
  },
  {
    q: "Our factory energy costs dropped 62% in the first year. The monitoring dashboard alone is worth it — we catch every anomaly before it becomes a problem.",
    n: "Klaus Weber",
    r: "Operations Director · Beverage Plant, Germany",
    i: "KW",
  },
  {
    q: "From quote to commissioning in 9 days. The crew was professional, the design was exactly as promised, and my first bill was nearly zero. Best investment I have made.",
    n: "Tendai Moyo",
    r: "Homeowner · Harare",
    i: "TM",
  },
  {
    q: "The solar traffic signals have transformed road safety in our district. Remote monitoring means our traffic department finally has real data and real control.",
    n: "Ing. Carla D.",
    r: "Municipal Traffic Authority",
    i: "CD",
  },
];

const AUTOPLAY_MS = 5600;

export default function Testimonials() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const dots = dotsRef.current;
    if (!wrap || !dots) return;

    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const dotEls = dotRefs.current.filter(Boolean) as HTMLElement[];
    if (!cards.length) return;

    let idx = 0;
    let autoTimer: ReturnType<typeof setInterval> | undefined;

    const restartAuto = () => {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => goTo(idx + 1), AUTOPLAY_MS);
    };

    const goTo = (n: number) => {
      idx = (n + cards.length) % cards.length;
      cards.forEach((card, i) => {
        gsap.killTweensOf(card);
        if (i === idx) {
          gsap.set(card, { visibility: "visible" });
          gsap.to(card, {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.65,
            ease: "power3.out",
          });
        } else {
          gsap.to(card, {
            opacity: 0,
            x: i < idx ? -60 : 60,
            scale: 0.96,
            duration: 0.45,
            ease: "power2.in",
            onComplete() {
              if (cards[i] !== cards[idx]) card.style.visibility = "hidden";
            },
          });
        }
      });
      dotEls.forEach((dot, i) => dot.classList.toggle("on", i === idx));
      restartAuto();
    };

    const dotHandlers = dotEls.map((dot, i) => {
      const handler = () => goTo(i);
      dot.addEventListener("click", handler);
      return handler;
    });

    const onNext = () => goTo(idx + 1);
    const onPrev = () => goTo(idx - 1);
    const onEnter = () => clearInterval(autoTimer);
    const onLeave = () => restartAuto();

    const nextBtn = document.getElementById("tstNext");
    const prevBtn = document.getElementById("tstPrev");
    nextBtn?.addEventListener("click", onNext);
    prevBtn?.addEventListener("click", onPrev);
    wrap.addEventListener("mouseenter", onEnter);
    wrap.addEventListener("mouseleave", onLeave);

    gsap.set(cards[0], { x: 60 });
    goTo(0);

    return () => {
      clearInterval(autoTimer);
      dotEls.forEach((dot, i) => dot.removeEventListener("click", dotHandlers[i]));
      nextBtn?.removeEventListener("click", onNext);
      prevBtn?.removeEventListener("click", onPrev);
      wrap.removeEventListener("mouseenter", onEnter);
      wrap.removeEventListener("mouseleave", onLeave);
      cards.forEach((card) => gsap.killTweensOf(card));
    };
  }, []);

  return (
    <section id="testimonials" className="sec-pad">
      <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
        <div className="rv">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Client voices
          </span>
        </div>
        <h2 className="mask-title">
          <span className="lm">
            <i>Trusted from rooftops to nations.</i>
          </span>
        </h2>
      </div>
      <div className="tst-wrap" id="tstWrap" ref={wrapRef}>
        {TESTIMONIALS.map((t, i) => (
          <div
            className="tst-card"
            key={t.n}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
          >
            <p className="q">{t.q}</p>
            <div className="tst-who">
              <div className="tst-av">{t.i}</div>
              <div>
                <div className="nm">{t.n}</div>
                <div className="rl">{t.r}</div>
              </div>
              <div className="tst-stars">★★★★★</div>
            </div>
          </div>
        ))}
      </div>
      <div className="tst-nav">
        <button id="tstPrev" aria-label="Previous">
          ←
        </button>
        <div className="tst-dots" id="tstDots" ref={dotsRef}>
          {TESTIMONIALS.map((t, i) => (
            <i
              key={t.n}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
            ></i>
          ))}
        </div>
        <button id="tstNext" aria-label="Next">
          →
        </button>
      </div>
    </section>
  );
}
