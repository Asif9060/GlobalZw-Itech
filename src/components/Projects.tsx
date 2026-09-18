"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

type CaseStudy = {
  tag: string;
  title: string;
  body: string;
  meta: { k: string; l: string }[];
  art?: ReactNode;
  cta?: boolean;
};

const CASES: CaseStudy[] = [
  {
    tag: "Utility Scale",
    title: "1.7 MW Containerised Solar Farm",
    body: "Grid-supporting containerised PV + storage plant stabilising a national utility grid.",
    meta: [
      { k: "1.7 MW", l: "Capacity" },
      { k: "3 MWh", l: "Storage" },
      { k: "Jamaica", l: "Location" },
    ],
    art: (
      <svg viewBox="0 0 640 560" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b1a05" />
            <stop offset=".55" stopColor="#101527" />
            <stop offset="1" stopColor="#060a14" />
          </linearGradient>
          <linearGradient id="p1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#27487f" />
            <stop offset="1" stopColor="#122246" />
          </linearGradient>
        </defs>
        <rect width="640" height="560" fill="url(#c1)" />
        <circle cx="480" cy="130" r="52" fill="#ffb703" opacity=".9" />
        <circle cx="480" cy="130" r="100" fill="#ffb703" opacity=".14" />
        <path d="M0 340h640v220H0z" fill="#0b1322" />
        <g fill="url(#p1)" stroke="#3a5f9e">
          <g transform="translate(0,0)">
            <rect x="40" y="360" width="120" height="46" rx="4" transform="skewY(-6)" />
            <rect x="200" y="360" width="120" height="46" rx="4" transform="skewY(-6)" />
            <rect x="360" y="360" width="120" height="46" rx="4" transform="skewY(-6)" />
            <rect x="520" y="360" width="120" height="46" rx="4" transform="skewY(-6)" />
          </g>
          <g>
            <rect x="20" y="450" width="140" height="54" rx="4" transform="skewY(-6)" />
            <rect x="200" y="450" width="140" height="54" rx="4" transform="skewY(-6)" />
            <rect x="380" y="450" width="140" height="54" rx="4" transform="skewY(-6)" />
            <rect x="560" y="450" width="140" height="54" rx="4" transform="skewY(-6)" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    tag: "Commercial Rooftop",
    title: "450 kW Factory Rooftop Array",
    body: "Cutting operating costs for a manufacturing plant with smart load-shifting storage.",
    meta: [
      { k: "450 kW", l: "Capacity" },
      { k: "464 kWh", l: "Battery" },
      { k: "Germany", l: "Location" },
    ],
    art: (
      <svg viewBox="0 0 640 560" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d2137" />
            <stop offset="1" stopColor="#050a14" />
          </linearGradient>
        </defs>
        <rect width="640" height="560" fill="url(#c2)" />
        <circle cx="120" cy="100" r="40" fill="#ffd166" opacity=".85" />
        <g fill="#0a1626" stroke="#1d3350">
          <rect x="80" y="280" width="110" height="240" />
          <rect x="210" y="220" width="130" height="300" />
          <rect x="360" y="300" width="100" height="220" />
          <rect x="480" y="250" width="120" height="270" />
        </g>
        <g fill="#27487f" stroke="#4a72b8">
          <rect x="222" y="200" width="106" height="34" rx="3" transform="skewX(-14)" />
          <rect x="492" y="230" width="96" height="32" rx="3" transform="skewX(-14)" />
        </g>
        <g fill="#ffd166" opacity=".8">
          <rect x="96" y="310" width="14" height="18" />
          <rect x="124" y="310" width="14" height="18" />
          <rect x="152" y="310" width="14" height="18" />
          <rect x="96" y="350" width="14" height="18" />
          <rect x="124" y="350" width="14" height="18" />
          <rect x="376" y="330" width="14" height="18" />
          <rect x="404" y="330" width="14" height="18" />
          <rect x="432" y="330" width="14" height="18" />
          <rect x="376" y="370" width="14" height="18" />
          <rect x="500" y="300" width="14" height="18" />
          <rect x="528" y="300" width="14" height="18" />
          <rect x="556" y="300" width="14" height="18" />
        </g>
      </svg>
    ),
  },
  {
    tag: "Off-Grid Village",
    title: "Rural Electrification — 3 Villages",
    body: "Solar mini-grids + battery banks bringing 24/7 power to communities beyond the grid.",
    meta: [
      { k: "820 kW", l: "Combined" },
      { k: "2,400", l: "Homes lit" },
      { k: "Zambia", l: "Location" },
    ],
    art: (
      <svg viewBox="0 0 640 560" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="c3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#123021" />
            <stop offset="1" stopColor="#04100a" />
          </linearGradient>
        </defs>
        <rect width="640" height="560" fill="url(#c3)" />
        <circle cx="520" cy="90" r="38" fill="#ffb703" />
        <path d="M0 430 Q160 380 320 425 T640 410 V560 H0 Z" fill="#071a10" />
        <g transform="translate(140,330)">
          <path d="M0 60 L40 0 L120 0 L160 60 Z" fill="#3a2a14" stroke="#57401f" />
          <rect
            x="45"
            y="6"
            width="70"
            height="26"
            fill="#27487f"
            stroke="#4a72b8"
            transform="skewX(-10)"
          />
          <rect x="20" y="60" width="120" height="42" fill="#241708" />
        </g>
        <g transform="translate(360,350)">
          <path d="M0 50 L34 0 L100 0 L134 50 Z" fill="#3a2a14" stroke="#57401f" />
          <rect
            x="38"
            y="5"
            width="58"
            height="22"
            fill="#27487f"
            stroke="#4a72b8"
            transform="skewX(-10)"
          />
          <rect x="16" y="50" width="102" height="36" fill="#241708" />
        </g>
        <rect
          x="250"
          y="430"
          width="52"
          height="70"
          rx="6"
          fill="#0e1c30"
          stroke="#3ddc84"
          strokeWidth="2"
        />
        <rect x="262" y="444" width="28" height="8" rx="3" fill="#3ddc84" />
        <rect x="262" y="460" width="28" height="8" rx="3" fill="#3ddc84" opacity=".6" />
        <rect x="262" y="476" width="28" height="8" rx="3" fill="#3ddc84" opacity=".3" />
      </svg>
    ),
  },
  {
    tag: "Solar + EV",
    title: "Solar Carport & DC Fast Charging Hub",
    body: "Shaded parking that generates power — 12 DC fast chargers fuelled entirely by the sun.",
    meta: [
      { k: "640 kWp", l: "Carport" },
      { k: "12", l: "DC chargers" },
      { k: "Thailand", l: "Location" },
    ],
    art: (
      <svg viewBox="0 0 640 560" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="c4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a1030" />
            <stop offset="1" stopColor="#06040f" />
          </linearGradient>
        </defs>
        <rect width="640" height="560" fill="url(#c4)" />
        <circle cx="100" cy="90" r="34" fill="#ffd166" opacity=".9" />
        <g fill="#27487f" stroke="#4a72b8">
          <rect x="180" y="150" width="330" height="16" rx="4" transform="skewX(-20)" />
          <rect x="200" y="180" width="330" height="16" rx="4" transform="skewX(-20)" />
        </g>
        <g stroke="#39506e" strokeWidth="8">
          <line x1="220" y1="170" x2="220" y2="330" />
          <line x1="430" y1="170" x2="430" y2="330" />
        </g>
        <rect x="0" y="330" width="640" height="230" fill="#0b0b18" />
        <g transform="translate(180,300)">
          <path
            d="M20 70 Q40 30 90 26 L170 26 Q215 32 235 70 L240 92 Q240 104 226 104 L26 104 Q12 104 14 92 Z"
            fill="#e8ecf4"
          />
          <circle cx="66" cy="104" r="18" fill="#101425" stroke="#39506e" strokeWidth="5" />
          <circle cx="192" cy="104" r="18" fill="#101425" stroke="#39506e" strokeWidth="5" />
          <path d="M60 50 L100 44 L100 68 L58 68 Z" fill="#7fb2ff" />
          <path d="M112 44 L160 44 L182 68 L112 68 Z" fill="#7fb2ff" />
        </g>
        <rect
          x="480"
          y="280"
          width="46"
          height="110"
          rx="10"
          fill="#141a2e"
          stroke="#3ddc84"
          strokeWidth="2"
        />
        <path d="M498 300 l-8 22 h12 l-10 24 22-30 h-13 l10-16z" fill="#3ddc84" />
      </svg>
    ),
  },
  {
    tag: "Smart Roads",
    title: "Solar Traffic Signal Network",
    body: "180 intersections retrofitted with solar LED signals and remote monitoring controllers.",
    meta: [
      { k: "180", l: "Intersections" },
      { k: "24/7", l: "Monitoring" },
      { k: "Zimbabwe", l: "Location" },
    ],
    art: (
      <svg viewBox="0 0 640 560" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="c5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#30200a" />
            <stop offset="1" stopColor="#0c0703" />
          </linearGradient>
        </defs>
        <rect width="640" height="560" fill="url(#c5)" />
        <circle cx="320" cy="420" r="120" fill="#fb8500" opacity=".35" />
        <circle cx="320" cy="420" r="70" fill="#ffb703" opacity=".8" />
        <rect x="0" y="470" width="640" height="90" fill="#0a0602" />
        <g transform="translate(90,300)">
          <rect x="14" y="-90" width="10" height="180" fill="#1c1c1c" />
          <rect
            x="-26"
            y="-130"
            width="90"
            height="70"
            rx="8"
            fill="#141a2e"
            stroke="#ffb703"
            strokeWidth="3"
          />
          <circle cx="19" cy="-95" r="16" fill="#3ddc84" />
          <circle cx="19" cy="-95" r="24" fill="#3ddc84" opacity=".25" />
        </g>
        <g transform="translate(500,300)">
          <rect x="14" y="-90" width="10" height="180" fill="#1c1c1c" />
          <rect
            x="-26"
            y="-130"
            width="90"
            height="70"
            rx="8"
            fill="#141a2e"
            stroke="#ffb703"
            strokeWidth="3"
          />
          <circle cx="19" cy="-95" r="16" fill="#ff5c5c" />
          <circle cx="19" cy="-95" r="24" fill="#ff5c5c" opacity=".25" />
        </g>
        <g fill="#27487f" stroke="#4a72b8">
          <rect x="230" y="430" width="80" height="30" rx="3" transform="skewX(-12)" />
          <rect x="340" y="430" width="80" height="30" rx="3" transform="skewX(-12)" />
        </g>
      </svg>
    ),
  },
  {
    tag: "",
    title: "Your project could be next.",
    body: "Tell us about your site and we'll design a system within 48 hours.",
    meta: [],
    cta: true,
  },
];

export default function Projects() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const getDist = () => Math.max(track.scrollWidth - window.innerWidth + 60, 0);

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -getDist(),
        ease: "none",
        scrollTrigger: {
          trigger: "#projects .proj-pin",
          start: "top top",
          end: () => "+=" + (getDist() + window.innerHeight * 0.5),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      /* cards subtle entry rotation */
      gsap.utils.toArray<HTMLElement>(".case-card").forEach((card, idx) => {
        gsap.from(card, {
          rotate: idx % 2 ? 2.5 : -2.5,
          scale: 0.92,
          opacity: 0.4,
          scrollTrigger: {
            trigger: "#projects .proj-pin",
            start: "top 80%",
            end: "top top",
            scrub: 1,
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="projects">
      <div className="proj-head">
        <div className="rv">
          <span className="eyebrow">Project cases</span>
        </div>
        <h2 className="mask-title">
          <span className="lm">
            <i>Powering the world,</i>
          </span>
          <span className="lm">
            <i>one installation at a time.</i>
          </span>
        </h2>
      </div>
      <div className="proj-pin">
        <div className="cases-track" id="casesTrack" ref={trackRef}>
          {CASES.map((study) =>
            study.cta ? (
              <div
                className="case-card"
                key="cta"
                style={{
                  background:
                    "linear-gradient(140deg,rgba(255,183,3,.14),rgba(255,255,255,.03))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  className="case-info"
                  style={{ position: "relative", textAlign: "center", padding: 50 }}
                >
                  <h3
                    style={{
                      fontSize: "clamp(26px,3vw,40px)",
                      maxWidth: 440,
                      margin: "0 auto",
                    }}
                  >
                    {study.title}
                  </h3>
                  <p style={{ margin: "18px auto 0" }}>{study.body}</p>
                  <a
                    href="#contact"
                    data-scroll
                    className="btn-primary"
                    style={{ display: "inline-block", marginTop: 28 }}
                  >
                    Start your project →
                  </a>
                </div>
              </div>
            ) : (
              <div className="case-card" key={study.title}>
                <div className="case-art">{study.art}</div>
                <div className="case-info">
                  <span className="case-tag">{study.tag}</span>
                  <h3>{study.title}</h3>
                  <p>{study.body}</p>
                  <div className="case-meta">
                    {study.meta.map((m) => (
                      <div key={m.l}>
                        <b>{m.k}</b>
                        {m.l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
      <p className="proj-hint">↔ Keep scrolling — the projects move with you</p>
    </section>
  );
}
