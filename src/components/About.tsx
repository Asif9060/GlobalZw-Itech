const PANELS_SMALL = [
  { x: 60, y: 330 },
  { x: 150, y: 345 },
  { x: 240, y: 330 },
  { x: 330, y: 350 },
];

const PANELS_LARGE = [
  { x: 105, y: 395 },
  { x: 205, y: 405 },
  { x: 305, y: 398 },
];

const BEAMS = [
  { x2: 60, y2: 322 },
  { x2: 150, y2: 337 },
  { x2: 240, y2: 322 },
];

export default function About() {
  return (
    <section id="about" className="sec-pad">
      <div
        className="glow-orb"
        style={{
          width: 480,
          height: 480,
          background: "rgba(255,183,3,.09)",
          top: -100,
          right: -140,
        }}
      ></div>
      <div className="about-wrap">
        <div className="about-sticky rv-l">
          <div className="about-visual">
            <svg viewBox="0 0 400 460" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="skyA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#131b33" />
                  <stop offset="1" stopColor="#3a2312" />
                </linearGradient>
                <linearGradient id="panelA" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1f3a6e" />
                  <stop offset="1" stopColor="#0e1c3a" />
                </linearGradient>
                <radialGradient id="sunA">
                  <stop offset="0" stopColor="#fff3c4" />
                  <stop offset=".5" stopColor="#ffb703" />
                  <stop offset="1" stopColor="rgba(251,133,0,0)" />
                </radialGradient>
              </defs>
              <rect width="400" height="460" fill="url(#skyA)" />
              <circle cx="300" cy="110" r="90" fill="url(#sunA)" opacity=".85">
                <animate
                  attributeName="cy"
                  values="115;100;115"
                  dur="7s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="300" cy="110" r="34" fill="#ffd166">
                <animate
                  attributeName="r"
                  values="34;38;34"
                  dur="3.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <path d="M0 300 Q90 250 170 295 T400 270 V460 H0 Z" fill="#1c1608" />
              <path d="M0 340 Q120 300 240 340 T400 325 V460 H0 Z" fill="#0b0803" />
              <g id="aboutPanels">
                {PANELS_SMALL.map((p) => (
                  <g transform={`translate(${p.x},${p.y})`} key={`s-${p.x}`}>
                    <rect
                      x="-30"
                      y="-14"
                      width="60"
                      height="28"
                      rx="3"
                      fill="url(#panelA)"
                      stroke="#2e5090"
                      strokeWidth="1.4"
                    />
                    <rect x="-2" y="14" width="4" height="14" fill="#333" />
                  </g>
                ))}
                {PANELS_LARGE.map((p) => (
                  <g transform={`translate(${p.x},${p.y})`} key={`l-${p.x}`}>
                    <rect
                      x="-34"
                      y="-16"
                      width="68"
                      height="32"
                      rx="3"
                      fill="url(#panelA)"
                      stroke="#2e5090"
                      strokeWidth="1.4"
                    />
                    <rect x="-2" y="16" width="4" height="14" fill="#333" />
                  </g>
                ))}
              </g>
              <g
                stroke="#ffb703"
                strokeWidth="1.4"
                opacity=".55"
                strokeDasharray="5 6"
              >
                {BEAMS.map((b) => (
                  <line x1="300" y1="140" x2={b.x2} y2={b.y2} key={`b-${b.x2}`}>
                    <animate
                      attributeName="stroke-dashoffset"
                      values="22;0"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </line>
                ))}
              </g>
            </svg>
          </div>
          <div className="badge-float bf1">
            <div className="k" data-count="15" data-suffix="+">
              0
            </div>
            <div className="l">Years Experience</div>
          </div>
          <div className="badge-float bf2">
            <div className="k" data-count="90" data-suffix="+">
              0
            </div>
            <div className="l">Countries Served</div>
          </div>
        </div>
        <div className="about-body">
          <div className="rv">
            <span className="eyebrow">Who we are</span>
          </div>
          <h2 className="mask-title">
            <span className="lm">
              <i>Make energy independence</i>
            </span>
            <span className="lm">
              <i>
                easy for{" "}
                <span
                  style={{
                    background: "var(--grad)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  everyone.
                </span>
              </i>
            </span>
          </h2>
          <p className="rv">
            SOLARIS Energy is a global supplier and installer of{" "}
            <b>solar PV systems, energy storage, and EV charging infrastructure</b>
            . From rooftop homes to utility-scale farms and solar-powered
            traffic signals — we design, supply, install and monitor systems
            that keep the lights on and bills down.
          </p>
          <p className="rv">
            Our team of engineers, financial analysts and certified technicians
            has commissioned <b>more than 48 MW of combined solar capacity</b>.
            Every installation is backed by live monitoring, rapid service
            response and industry-leading warranties.
          </p>
          <div className="counters">
            <div className="counter rv">
              <div className="num" data-count="6200" data-suffix="+">
                0
              </div>
              <div className="lab">Systems installed worldwide</div>
            </div>
            <div className="counter rv">
              <div className="num" data-count="120" data-suffix="k+">
                0
              </div>
              <div className="lab">Tonnes CO₂ offset per year</div>
            </div>
            <div className="counter rv">
              <div className="num" data-count="600" data-suffix="+">
                0
              </div>
              <div className="lab">Patents &amp; certified designs</div>
            </div>
            <div className="counter rv">
              <div className="num" data-count="25" data-suffix=" yr">
                0
              </div>
              <div className="lab">Panel performance warranty</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
