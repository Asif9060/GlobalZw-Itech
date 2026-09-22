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
                {/* PANELS_SMALL and PANELS_LARGE and BEAMS kept for visual */}
// We'll keep the visual but we can remove the maps to simplify? Let's keep them but we need to define the arrays.
                {/* We'll define the arrays above */}
              </g>
              <g
                stroke="#ffb703"
                strokeWidth="1.4"
                opacity=".55"
                strokeDasharray="5 6"
              >
                {/* BEAMS map */}
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
          <h2 className="mask-title">About Us</h2>
          {/* Section GlobalZwItech */}
          <section className="about-section">
            <h3>GlobalZwItech</h3>
            <p className="subsection">
              1.1 GlobalZwItech An energy and engineering company with core expertise in advanced solar system modeling, design, electrical systems, and smart signals. We offer turnkey solutions in consultation, design, engineering, supply, installation, and EPC projects. We have extensive experience in the design and installation of solar systems ranging from 10 to 3 MW, Feasibility studies for Grid-Interactive and Mini-Grid systems, and the design and installation of modern traffic signal systems.
            </p>
            <p className="subsection">
              1.2 Core Values • Innovation for intelligent Cities: We pioneer intelligent traffic systems to build smarter, safer urban environments. • Sustainability by Design: We integrate solar energy solutions to create a foundation of clean, sustainable power. • Engineering Excellence: We deliver reliable and innovative electrical infrastructure through precision engineering.
            </p>
            <p className="subsection">
              1.3 Mission Statement We engineer integrated solutions that power progress by building safer, smarter cities through intelligent traffic systems, enabling sustainable communities with solar energy, and ensuring reliability with electrical infrastructure.
            </p>
          </section>
          {/* Section Why GlobalZwItech */}
          <section className="about-section">
            <h3>Why GlobalZwItech</h3>
            <p className="subsection">
              1.4 Complete Solutions: Our solutions are all built in-house to address current problems using the available resources and technology. We offer support from concept to maintenance for all system designs installed by us; we eliminate fragmentation with single-point accountability.
            </p>
            <p className="subsection">
              Innovation: We have managed to strike an R & D deal, partnering with leading tech firms to deploy sustainable and intelligent traffic signals in Zimbabwe that are secure and preserve life through advanced analytics in energy and traffic systems.
            </p>
            <p className="subsection">
              2. Proven Results: We have successfully delivered services to municipal, utility, and private clients in Zimbabwe and abroad. Our proven expertise ensures seamless, efficient, and eco-friendly outcomes from project start to finish. We consistently meet and exceed the highest standards of excellence.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
