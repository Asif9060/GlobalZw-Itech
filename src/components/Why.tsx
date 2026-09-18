const REASONS = [
  {
    n: "Q1",
    title: "Tier-1 Quality & 25-Year Warranty",
    body: "ISO 9001 certified processes, Tier-1 modules and premium inverters — every component traceable, tested and warrantied for decades.",
  },
  {
    n: "E2",
    title: "In-House Engineering Expertise",
    body: "Certified engineers design every system against real load data, shading analysis and local codes — no templates, no guesswork.",
  },
  {
    n: "R3",
    title: "Rapid Response Service Network",
    body: "Regional service centres and remote diagnostics mean issues are resolved in hours, not weeks. 99.8% fleet uptime, proven.",
  },
  {
    n: "M4",
    title: "Live Monitoring Included",
    body: "Watch every kWh from your phone. Production dashboards, weather overlays, alerts and monthly reports — free for the life of your system.",
  },
];

export default function Why() {
  return (
    <section id="why" className="sec-pad">
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto 56px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div className="rv">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Why SOLARIS
          </span>
        </div>
        <h2 className="mask-title">
          <span className="lm">
            <i>Built different. Built to last.</i>
          </span>
        </h2>
      </div>
      <div className="why-grid">
        {REASONS.map((reason) => (
          <div className="why-row rv" key={reason.n}>
            <div className="n">{reason.n}</div>
            <div>
              <h4>{reason.title}</h4>
              <p>{reason.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
