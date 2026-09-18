"use client";

import {
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useSite } from "@/components/SiteProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Footer() {
  const { badgeCount, setAdminOpen, showToast } = useSite();
  const [year] = useState(() => new Date().getFullYear());
  const newsInput = useRef<HTMLInputElement>(null);

  const onSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = newsInput.current;
    if (!input) return;
    if (!EMAIL_RE.test(input.value)) {
      showToast("⚠ Please enter a valid email.");
      return;
    }
    showToast("✅ Subscribed! Welcome to the SOLARIS newsletter.");
    input.value = "";
  };

  const linkHover = {
    onMouseOver: (e: ReactMouseEvent<HTMLAnchorElement>) => {
      e.currentTarget.style.color = "#ffb703";
    },
    onMouseOut: (e: ReactMouseEvent<HTMLAnchorElement>) => {
      e.currentTarget.style.color = "";
    },
  };

  return (
    <footer>
      <div className="foot-grid">
        <div className="foot-brand">
          <a href="#home" data-scroll className="logo">
            <svg viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="8" fill="#ffb703" />
              <g stroke="#fb8500" strokeWidth="2.6" strokeLinecap="round">
                <line x1="20" y1="2" x2="20" y2="8" />
                <line x1="20" y1="32" x2="20" y2="38" />
                <line x1="2" y1="20" x2="8" y2="20" />
                <line x1="32" y1="20" x2="38" y2="20" />
                <line x1="7" y1="7" x2="11.5" y2="11.5" />
                <line x1="28.5" y1="28.5" x2="33" y2="33" />
                <line x1="33" y1="7" x2="28.5" y2="11.5" />
                <line x1="11.5" y1="28.5" x2="7" y2="33" />
              </g>
            </svg>
            SOLAR<em>IS</em>
          </a>
          <p>
            The better energy, every day. Solar PV, storage, EV charging and
            smart traffic systems — engineered for a cleaner planet.
          </p>
        </div>
        <div className="foot-col">
          <h5>Solutions</h5>
          <a href="#services" data-scroll>
            Residential Solar
          </a>
          <a href="#services" data-scroll>
            Commercial &amp; Industrial
          </a>
          <a href="#services" data-scroll>
            Battery Storage
          </a>
          <a href="#services" data-scroll>
            EV Charging
          </a>
          <a href="#services" data-scroll>
            Traffic Signals
          </a>
        </div>
        <div className="foot-col">
          <h5>Company</h5>
          <a href="#about" data-scroll>
            About Us
          </a>
          <a href="#projects" data-scroll>
            Projects
          </a>
          <a href="#process" data-scroll>
            Our Process
          </a>
          <a href="#testimonials" data-scroll>
            Testimonials
          </a>
          <a href="#contact" data-scroll>
            Contact
          </a>
        </div>
        <div className="foot-col">
          <h5>Newsletter</h5>
          <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7 }}>
            Monthly sun reports, product launches &amp; savings tips.
          </p>
          <form className="news-form" id="newsForm" onSubmit={onSubscribe}>
            <input
              type="email"
              placeholder="Your email address"
              required
              ref={newsInput}
            />
            <button type="submit">JOIN</button>
          </form>
        </div>
      </div>
      <div className="foot-bottom">
        <span>
          © <span id="yearNow">{year}</span> SOLARIS Energy Technologies. All
          rights reserved.
        </span>
        <span
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <a href="#" style={{ transition: ".3s" }} {...linkHover}>
            Privacy Policy
          </a>
          <a href="#" style={{ transition: ".3s" }} {...linkHover}>
            Terms
          </a>
          <button id="adminBtn" onClick={() => setAdminOpen(true)}>
            🛡 Admin Portal{" "}
            <span
              className="q-badge"
              id="qBadge"
              style={badgeCount ? { display: "inline-block" } : undefined}
            >
              {badgeCount}
            </span>
          </button>
        </span>
      </div>
    </footer>
  );
}
