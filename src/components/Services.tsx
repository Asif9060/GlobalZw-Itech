import type { ReactNode } from "react";

type Service = {
  num: string;
  title: ReactNode;
  body: string;
  icon: ReactNode;
};

const SERVICES: Service[] = [
  {
    num: "01",
    title: "Residential Solar",
    body: "Slash your electricity bills by up to 90%. Tailored rooftop systems for every home size — efficient, scalable and beautifully installed.",
    icon: (
      <>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
        <circle cx="12" cy="5.5" r="0" />
      </>
    ),
  },
  {
    num: "02",
    title: "Commercial & Industrial",
    body: "Take control of energy expenses with MW-scale rooftop and ground-mount systems. Guarantee 100% uptime for your operations.",
    icon: (
      <>
        <path d="M2 20h20" />
        <path d="M4 20V9l6-3v14" />
        <path d="M10 20V6l8 3v11" />
        <path d="M13 10h2M13 14h2M7 11h1M7 15h1" />
      </>
    ),
  },
  {
    num: "03",
    title: "Battery Energy Storage",
    body: "Hybrid inverters, all-in-one BESS cabinets and lithium battery solutions. Store the sun and use it after dark — total energy independence.",
    icon: (
      <>
        <rect x="4" y="7" width="14" height="11" rx="2" />
        <path d="M18 10h2v5h-2" />
        <path d="M11 9l-2 4h3l-2 4" />
      </>
    ),
  },
  {
    num: "04",
    title: "EV Charging Stations",
    body: "AC & DC fast chargers for homes, fleets and public networks. Plug into the future — fuelled directly by your solar array.",
    icon: <path d="M13 2L5 13h5l-1 9 9-12h-5l1-8z" />,
  },
  {
    num: "05",
    title: "Solar Traffic Signals",
    body: "LED signal heads, controllers and pedestrian crossings — locally assembled, remotely monitored, built to keep roads safe off-grid.",
    icon: (
      <>
        <rect x="8" y="2" width="8" height="14" rx="3" />
        <circle cx="12" cy="6" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <path d="M12 16v6" />
        <path d="M8 22h8" />
      </>
    ),
  },
  {
    num: "06",
    title: "Monitoring & O&M",
    body: "24/7 live system monitoring, predictive alerts, cleaning schedules and certified maintenance. Your system, always at peak output.",
    icon: (
      <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.4 2.4-2.3-2.3 2.4-2.4z" />
    ),
  },
];

export default function Services() {
  return (
    <section id="services" className="sec-pad">
      <div
        className="glow-orb"
        style={{
          width: 520,
          height: 520,
          background: "rgba(251,133,0,.08)",
          bottom: -160,
          left: -160,
        }}
      ></div>
      <div className="svc-head">
        <div>
          <div className="rv">
            <span className="eyebrow">What we do</span>
          </div>
          <h2 className="mask-title">
            <span className="lm">
              <i>Complete solar solutions,</i>
            </span>
            <span className="lm">
              <i>from panel to planet.</i>
            </span>
          </h2>
        </div>
        <p className="sec-sub rv">
          Six core divisions. One mission — deliver affordable, reliable clean
          energy to every home, factory and road.
        </p>
      </div>
      <div className="svc-grid">
        {SERVICES.map((service) => (
          <div className="svc-card rv tilt" key={service.num}>
            <div className="svc-num">{service.num}</div>
            <div className="svc-ico">
              <svg viewBox="0 0 24 24">{service.icon}</svg>
            </div>
            <h3>{service.title}</h3>
            <p>{service.body}</p>
            <a href="#contact" data-scroll className="svc-link">
              Enquire →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
