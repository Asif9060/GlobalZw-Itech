"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const SEGMENTS = [
  { label: "Grid-Tie", mult: 1 },
  { label: "Hybrid + Battery", mult: 1.35 },
  { label: "Off-Grid", mult: 1.5 },
];

export default function Calculator() {
  const billR = useRef<HTMLInputElement>(null);
  const areaR = useRef<HTMLInputElement>(null);
  const sunR = useRef<HTMLInputElement>(null);
  const todR = useRef<HTMLInputElement>(null);

  const billV = useRef<HTMLSpanElement>(null);
  const areaV = useRef<HTMLSpanElement>(null);
  const sunV = useRef<HTMLSpanElement>(null);
  const todV = useRef<HTMLElement>(null);

  const knobRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  const segRef = useRef<HTMLDivElement>(null);

  const nowKWEl = useRef<HTMLSpanElement>(null);
  const sysKWEl = useRef<HTMLSpanElement>(null);
  const yrKWHEl = useRef<HTMLSpanElement>(null);
  const yrSaveEl = useRef<HTMLSpanElement>(null);
  const paybackEl = useRef<HTMLSpanElement>(null);
  const co2El = useRef<HTMLSpanElement>(null);
  const treesEl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const billInput = billR.current;
    const areaInput = areaR.current;
    const sunInput = sunR.current;
    const todInput = todR.current;
    const knob = knobRef.current;
    const arc = arcRef.current;
    const seg = segRef.current;
    if (
      !billInput ||
      !areaInput ||
      !sunInput ||
      !todInput ||
      !knob ||
      !arc ||
      !seg
    ) {
      return;
    }

    let sysMult = 1;
    const disp = { nowKW: 0, sysKW: 0, yrKWH: 0, yrSave: 0, payback: 0, co2: 0, trees: 0 };

    const positionKnob = () => {
      const p = (parseFloat(todInput.value) - 6) / 12;
      const arcBox = knob.parentElement!.getBoundingClientRect();
      const w = arcBox.width;
      const h = arcBox.height;
      /* quadratic bezier approximation of the arc path */
      const x =
        (1 - p) * (1 - p) * ((14 / 300) * w) +
        2 * (1 - p) * p * (w / 2) +
        p * p * ((286 / 300) * w);
      const y =
        (1 - p) * (1 - p) * ((84 / 90) * h) +
        2 * (1 - p) * p * ((-14 / 90) * h) +
        p * p * ((84 / 90) * h);
      knob.style.left = x + "px";
      knob.style.top = y + "px";
      const glow = Math.sin(p * Math.PI);
      knob.style.boxShadow = `0 0 ${14 + glow * 26}px ${4 + glow * 8}px rgba(255,183,3,${0.35 + glow * 0.4})`;
    };

    const compute = (animateNow: boolean) => {
      const bill = parseFloat(billInput.value);
      const area = parseFloat(areaInput.value);
      const sunH = parseFloat(sunInput.value) / 10;
      const tod = parseFloat(todInput.value);

      if (billV.current) billV.current.textContent = "$" + bill;
      if (areaV.current) areaV.current.textContent = area + " m²";
      if (sunV.current) sunV.current.textContent = sunH.toFixed(1) + " h";
      const hh = Math.floor(tod);
      const mm = Math.floor((tod % 1) * 60);
      if (todV.current) {
        todV.current.textContent =
          String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
      }
      positionKnob();

      /* limited by area or need */
      const sysKW = Math.min(area * 0.2, bill / 6);
      const intensity = Math.max(0, Math.sin(((tod - 6) / 12) * Math.PI));
      const nowKW = sysKW * intensity;
      const yrKWH = sysKW * sunH * 365 * 0.85;
      const annualUse = (bill / 0.15) * 12;
      const yrSave = Math.min(yrKWH, annualUse) * 0.15;
      const cost = sysKW * 950 * sysMult;
      const payback = yrSave > 0 ? cost / yrSave : 99;
      const co2 = yrKWH * 0.0007;
      const trees = Math.round(co2 * 45);

      gsap.to(disp, {
        nowKW,
        sysKW,
        yrKWH,
        yrSave,
        payback,
        co2,
        trees,
        duration: animateNow ? 0.9 : 0.35,
        ease: "power2.out",
        onUpdate() {
          if (nowKWEl.current) nowKWEl.current.textContent = disp.nowKW.toFixed(1);
          if (sysKWEl.current) sysKWEl.current.textContent = disp.sysKW.toFixed(1);
          if (yrKWHEl.current)
            yrKWHEl.current.textContent = Math.round(disp.yrKWH).toLocaleString();
          if (yrSaveEl.current)
            yrSaveEl.current.textContent = Math.round(disp.yrSave).toLocaleString();
          if (paybackEl.current)
            paybackEl.current.textContent =
              disp.payback > 50 ? "—" : disp.payback.toFixed(1);
          if (co2El.current) co2El.current.textContent = disp.co2.toFixed(1);
          if (treesEl.current)
            treesEl.current.textContent = Math.round(disp.trees).toLocaleString();
        },
      });

      /* gauge: arc length ~295 */
      const gaugeCap = Math.max(sysKW, 1);
      arc.style.strokeDashoffset = String(
        295 - 295 * Math.min(nowKW / gaugeCap, 1),
      );

      /* knob pulse when output high */
      if (intensity > 0.9 && animateNow) {
        gsap.fromTo(
          knob,
          { scale: 1.25 },
          { scale: 1, duration: 0.6, ease: "elastic.out(1,.4)" },
        );
      }
    };

    const segButtons = Array.from(seg.querySelectorAll<HTMLButtonElement>("button"));
    const onSegClick = (btn: HTMLButtonElement) => () => {
      segButtons.forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      sysMult = parseFloat(btn.dataset.mult || "1");
      compute(true);
      gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
    };
    const segHandlers = segButtons.map((btn) => {
      const handler = onSegClick(btn);
      btn.addEventListener("click", handler);
      return handler;
    });

    const inputs = [billInput, areaInput, sunInput, todInput];
    const onInput = () => compute(false);
    inputs.forEach((input) => input.addEventListener("input", onInput));
    window.addEventListener("resize", positionKnob);

    compute(false);

    const enterTrigger = ScrollTrigger.create({
      trigger: "#calculator",
      start: "top 70%",
      once: true,
      onEnter: () => compute(true),
    });

    return () => {
      inputs.forEach((input) => input.removeEventListener("input", onInput));
      segButtons.forEach((btn, i) => btn.removeEventListener("click", segHandlers[i]));
      window.removeEventListener("resize", positionKnob);
      enterTrigger.kill();
      gsap.killTweensOf(disp);
    };
  }, []);

  return (
    <section id="calculator" className="sec-pad">
      <div
        className="glow-orb"
        style={{
          width: 500,
          height: 500,
          background: "rgba(255,183,3,.08)",
          top: -140,
          left: "30%",
        }}
      ></div>
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto 54px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div className="rv" style={{ justifyContent: "center" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Interactive savings calculator
          </span>
        </div>
        <h2 className="mask-title">
          <span className="lm">
            <i>How much could the sun</i>
          </span>
          <span className="lm">
            <i>
              save{" "}
              <span
                style={{
                  background: "var(--grad)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                you?
              </span>
            </i>
          </span>
        </h2>
        <p
          className="sec-sub rv"
          style={{ margin: "22px auto 0", textAlign: "center" }}
        >
          Drag the sliders, move the sun, and watch your numbers come alive. Real
          estimates in real time.
        </p>
      </div>
      <div className="calc-wrap">
        <div className="calc-panel rv-l">
          <h3>⚙️ Design your system</h3>
          <p>Adjust the inputs — every result recalculates instantly.</p>
          <div className="ctrl">
            <label>
              Monthly electricity bill{" "}
              <b>
                <span id="billV" ref={billV}>$220</span>
              </b>
            </label>
            <input
              type="range"
              id="billR"
              min="40"
              max="1200"
              step="10"
              defaultValue="220"
              ref={billR}
            />
          </div>
          <div className="ctrl">
            <label>
              Available roof / land area{" "}
              <b>
                <span id="areaV" ref={areaV}>60 m²</span>
              </b>
            </label>
            <input
              type="range"
              id="areaR"
              min="10"
              max="400"
              step="5"
              defaultValue="60"
              ref={areaR}
            />
          </div>
          <div className="ctrl">
            <label>
              Daily peak sun hours{" "}
              <b>
                <span id="sunV" ref={sunV}>5.0 h</span>
              </b>
            </label>
            <input
              type="range"
              id="sunR"
              min="25"
              max="80"
              step="1"
              defaultValue="50"
              ref={sunR}
            />
          </div>
          <div className="ctrl">
            <label>System type</label>
            <div className="seg" id="sysSeg" ref={segRef}>
              {SEGMENTS.map((segment, i) => (
                <button
                  key={segment.label}
                  data-mult={segment.mult}
                  className={i === 0 ? "on" : undefined}
                >
                  {segment.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ctrl sun-slider-wrap">
            <label>
              ☀ Time of day — drag the sun <b id="todV" ref={todV}>12:00</b>
            </label>
            <div className="sun-arc">
              <svg viewBox="0 0 300 90" preserveAspectRatio="none">
                <path
                  d="M14 84 Q150 -18 286 84"
                  fill="none"
                  stroke="rgba(255,183,3,.28)"
                  strokeWidth="2.5"
                  strokeDasharray="6 7"
                />
                <line
                  x1="10"
                  y1="84"
                  x2="290"
                  y2="84"
                  stroke="rgba(255,255,255,.12)"
                  strokeWidth="2"
                />
              </svg>
              <div className="sun-knob" id="sunKnob" ref={knobRef}>
                ☀
              </div>
            </div>
            <input
              type="range"
              id="todR"
              min="6"
              max="18"
              step="0.1"
              defaultValue="12"
              ref={todR}
            />
          </div>
        </div>
        <div className="result-panel rv-r">
          <h3>⚡ Your live estimate</h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Instant output, updated as the sun moves.
          </p>
          <div className="gauge-wrap">
            <svg viewBox="0 0 220 122">
              <defs>
                <linearGradient id="gg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#fb8500" />
                  <stop offset="1" stopColor="#ffd166" />
                </linearGradient>
              </defs>
              <path
                d="M16 112 A94 94 0 0 1 204 112"
                fill="none"
                stroke="rgba(255,255,255,.08)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                id="gaugeArc"
                ref={arcRef}
                d="M16 112 A94 94 0 0 1 204 112"
                fill="none"
                stroke="url(#gg)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="295"
                strokeDashoffset="295"
                style={{
                  filter: "drop-shadow(0 0 8px rgba(255,183,3,.55))",
                  transition: "stroke-dashoffset .25s",
                }}
              />
            </svg>
            <div className="gauge-center">
              <div className="v">
                <span id="nowKW" ref={nowKWEl}>0.0</span> kW
              </div>
              <div className="l">Producing right now</div>
            </div>
          </div>
          <div className="res-grid">
            <div className="res-box">
              <div className="v">
                <span id="sysKW" ref={sysKWEl}>0</span> <span>kWp</span>
              </div>
              <div className="l">System size</div>
            </div>
            <div className="res-box">
              <div className="v">
                <span id="yrKWH" ref={yrKWHEl}>0</span> <span>kWh</span>
              </div>
              <div className="l">Yearly generation</div>
            </div>
            <div className="res-box green">
              <div className="v">
                $<span id="yrSave" ref={yrSaveEl}>0</span>
              </div>
              <div className="l">Yearly savings</div>
            </div>
            <div className="res-box green">
              <div className="v">
                <span id="payback" ref={paybackEl}>0</span> <span>yrs</span>
              </div>
              <div className="l">Payback period</div>
            </div>
            <div className="res-box">
              <div className="v">
                <span id="co2" ref={co2El}>0</span> <span>t/yr</span>
              </div>
              <div className="l">CO₂ avoided</div>
            </div>
            <div className="res-box">
              <div className="v">
                <span id="trees" ref={treesEl}>0</span>
              </div>
              <div className="l">Trees equivalent 🌳</div>
            </div>
          </div>
          <div className="calc-cta">
            <a href="#contact" data-scroll className="btn-primary">
              Request this system →
            </a>
          </div>
          <p className="calc-note">
            * Indicative estimate based on 20% efficient modules, 0.85 performance
            ratio and a $0.15/kWh tariff. Your consultant will provide a certified
            design.
          </p>
        </div>
      </div>
    </section>
  );
}
