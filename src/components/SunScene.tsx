"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const ROW_DEFS = [
  { bottom: "2%", count: 9, w: 120, h: 56, op: 1 },
  { bottom: "16%", count: 11, w: 92, h: 44, op: 0.85 },
  { bottom: "28%", count: 13, w: 68, h: 33, op: 0.65 },
];

const CLOUDS = [
  { width: 180, top: "18%", left: "12%" },
  { width: 260, top: "26%", left: "58%" },
  { width: 140, top: "12%", left: "74%" },
  { width: 200, top: "33%", left: "30%" },
];

export default function SunScene() {
  const sunRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sunEl = sunRef.current;
    const timeEl = timeRef.current;
    const pctEl = pctRef.current;
    if (!sunEl || !timeEl || !pctEl) return;

    const sceneState = { prog: 0 };
    const sceneEl = rootRef.current;

    // No scope element on purpose: the trigger below IS this component's own
    // root, and a scoped context can't match the scope element itself.
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sceneEl,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: (self) => {
          sceneState.prog = self.progress;
        },
      });

      /* layer parallax */
      gsap.to("#cloudLayer", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: sceneEl,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
      gsap.to("#hillBack", {
        yPercent: -16,
        ease: "none",
        scrollTrigger: {
          trigger: sceneEl,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
      gsap.to("#hillFront", {
        yPercent: -30,
        ease: "none",
        scrollTrigger: {
          trigger: sceneEl,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
      gsap.to("#panelField", {
        yPercent: -42,
        ease: "none",
        scrollTrigger: {
          trigger: sceneEl,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
      gsap.to(".scene-caption", {
        yPercent: -70,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: sceneEl,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    });

    const tick = () => {
      const p = sceneState.prog;

      /* sun travels along an arc */
      const sx = 8 + p * 84; /* % left */
      const sy = 78 - Math.sin(p * Math.PI) * 58; /* % top */
      sunEl.style.left = sx + "%";
      sunEl.style.top = sy + "%";
      const intensity = Math.max(0, Math.sin(p * Math.PI));
      sunEl.style.filter = `brightness(${0.55 + intensity * 0.75})`;

      /* hour readout 06:00 → 18:00 */
      const hourFloat = 6 + p * 12;
      const hh = String(Math.floor(hourFloat)).padStart(2, "0");
      const mm = String(Math.floor((hourFloat % 1) * 60)).padStart(2, "0");
      timeEl.textContent = hh + ":" + mm;
      pctEl.textContent = Math.round(intensity * 100) + "%";

      /* panels tilt to follow the sun */
      const tiltDeg = -32 + p * 64;
      document.querySelectorAll<SVGGElement>(".pf-tilt").forEach((g) => {
        const parent = g.parentNode as SVGSVGElement | null;
        const width = parseFloat(parent?.getAttribute("width") || "60");
        g.setAttribute("transform", `rotate(${tiltDeg * 0.18} ${width / 2} 28)`);
      });
      document.querySelectorAll<SVGGElement>(".pf-row svg .pf-tilt").forEach((g) => {
        g.style.transformOrigin = "center";
        g.setAttribute("transform", `skewX(${tiltDeg * 0.35})`);
      });
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      ctx.revert();
    };
  }, []);

  return (
    <section id="scene" ref={rootRef}>
      <div className="scene-pin">
        <div className="scene-layer scene-sky" data-speed="0"></div>
        <div className="scene-layer" id="sceneSunLayer">
          <div className="scene-sun" id="sceneSun" ref={sunRef}></div>
        </div>
        <div className="scene-layer" id="cloudLayer">
          {CLOUDS.map((cloud, i) => (
            <div className="cloud" style={cloud} key={i}></div>
          ))}
        </div>
        <div className="scene-layer">
          <div className="hill hill-b" id="hillBack"></div>
        </div>
        <div className="scene-layer">
          <div className="hill hill-f" id="hillFront"></div>
        </div>
        <div className="scene-layer panel-field" id="panelField" ref={fieldRef}>
          {ROW_DEFS.map((def, di) => (
            <div
              className="pf-row"
              style={{ bottom: def.bottom }}
              data-row={di}
              key={di}
            >
              {Array.from({ length: def.count }, (_, i) => (
                <div className="pf-panel" key={i}>
                  <svg
                    width={def.w}
                    height={def.h + 26}
                    viewBox={`0 0 ${def.w} ${def.h + 26}`}
                    style={{ opacity: def.op }}
                  >
                    <g className="pf-tilt">
                      <rect
                        x="0"
                        y="0"
                        width={def.w}
                        height={def.h}
                        rx="4"
                        fill="#16305e"
                        stroke="#3a5f9e"
                        strokeWidth="1.5"
                      />
                      <line
                        x1={def.w / 3}
                        y1="0"
                        x2={def.w / 3}
                        y2={def.h}
                        stroke="#3a5f9e"
                        strokeWidth="1"
                      />
                      <line
                        x1={(2 * def.w) / 3}
                        y1="0"
                        x2={(2 * def.w) / 3}
                        y2={def.h}
                        stroke="#3a5f9e"
                        strokeWidth="1"
                      />
                      <line
                        x1="0"
                        y1={def.h / 2}
                        x2={def.w}
                        y2={def.h / 2}
                        stroke="#3a5f9e"
                        strokeWidth="1"
                      />
                    </g>
                    <rect
                      x={def.w / 2 - 3}
                      y={def.h}
                      width="6"
                      height="24"
                      fill="#0d0d14"
                    />
                  </svg>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="scene-caption">
          <span className="eyebrow" style={{ color: "#ffd166" }}>
            Live solar tracking
          </span>
          <h2 style={{ color: "#fff", textShadow: "0 4px 30px rgba(0,0,0,.6)" }}>
            The panels follow
            <br />
            the sun — <span style={{ color: "#ffd166" }}>all day long.</span>
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,.75)",
              marginTop: 16,
              fontSize: 14.5,
              lineHeight: 1.7,
              maxWidth: 400,
            }}
          >
            Scroll to move the sun across the sky. Our smart-tracking mounts keep
            every module at the perfect angle for maximum harvest.
          </p>
        </div>
        <div className="scene-readout">
          <div className="t">Sun position</div>
          <div className="v" id="sceneTime" ref={timeRef}>
            06:00
          </div>
          <div className="s">
            Output:{" "}
            <b id="scenePct" style={{ color: "#3ddc84" }} ref={pctRef}>
              0%
            </b>{" "}
            of peak
          </div>
        </div>
      </div>
    </section>
  );
}
