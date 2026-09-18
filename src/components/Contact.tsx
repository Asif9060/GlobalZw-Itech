"use client";

import { useRef, type FormEvent } from "react";
import { gsap } from "@/lib/gsap";
import { useSite } from "@/components/SiteProvider";

const COUNTRIES = [
  "Zimbabwe",
  "South Africa",
  "Zambia",
  "Botswana",
  "Mozambique",
  "Malawi",
  "Tanzania",
  "Kenya",
  "Nigeria",
  "Ghana",
  "Germany",
  "United Kingdom",
  "United States",
  "Australia",
  "China",
  "India",
  "UAE",
  "Other",
];

const ENQUIRY_TYPES = [
  "Home / Residential",
  "Business / Commercial",
  "Industrial / Utility",
  "Traffic Signals",
  "EV Charging",
];

const SYSTEM_TYPES = [
  "Grid-Tie",
  "Off-Grid",
  "Battery Backup",
  "Hybrid",
  "Not sure — advise me",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const { addQuery, showToast, setSuccessOpen } = useSite();

  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLSelectElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const systemRef = useRef<HTMLSelectElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    const fields: { el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement; ok: (v: string) => boolean }[] = [
      { el: firstRef.current!, ok: (v) => v.trim().length > 1 },
      { el: lastRef.current!, ok: (v) => v.trim().length > 1 },
      { el: emailRef.current!, ok: (v) => EMAIL_RE.test(v) },
      { el: phoneRef.current!, ok: (v) => v.trim().length > 5 },
      { el: countryRef.current!, ok: (v) => v !== "" },
      { el: typeRef.current!, ok: (v) => v !== "" },
      { el: msgRef.current!, ok: (v) => v.trim().length > 4 },
    ];

    let valid = true;
    let firstBad: HTMLElement | null = null;

    fields.forEach((field) => {
      const wrap = field.el.closest(".field");
      if (!wrap) return;
      const good = field.ok(field.el.value);
      wrap.classList.toggle("invalid", !good);
      if (!good) {
        valid = false;
        firstBad = firstBad || field.el;
        gsap.fromTo(wrap, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,.3)" });
      }
    });

    if (!valid) {
      (firstBad as HTMLElement | null)?.focus();
      showToast("⚠ Please complete the highlighted fields.");
      return;
    }

    const btn = submitRef.current;
    if (btn) {
      btn.textContent = "Transmitting… ☀";
      btn.style.pointerEvents = "none";
    }

    /* simulate transmission delay for feedback */
    setTimeout(() => {
      addQuery({
        first: firstRef.current!.value.trim(),
        last: lastRef.current!.value.trim(),
        email: emailRef.current!.value.trim(),
        phone: phoneRef.current!.value.trim(),
        country: countryRef.current!.value,
        city: cityRef.current!.value.trim(),
        type: typeRef.current!.value,
        system: systemRef.current!.value,
        message: msgRef.current!.value.trim(),
      });
      form.reset();
      if (btn) {
        btn.textContent = "Submit Query ☀";
        btn.style.pointerEvents = "auto";
      }
      setSuccessOpen(true);
    }, 900);
  };

  return (
    <section id="contact" className="sec-pad">
      <div
        className="glow-orb"
        style={{
          width: 560,
          height: 560,
          background: "rgba(255,183,3,.09)",
          top: -180,
          right: -160,
        }}
      ></div>
      <div className="contact-wrap">
        <div className="contact-info rv-l">
          <span className="eyebrow">Get in touch</span>
          <h2>
            Let&apos;s design your
            <br />
            <span
              style={{
                background: "var(--grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              energy freedom.
            </span>
          </h2>
          <p>
            Send us a query and a solar consultant will contact you within one
            business day with a free, no-obligation design and quote.
          </p>
          <div className="ci-list">
            <div className="ci-item">
              <div className="ci-ico">
                <svg viewBox="0 0 24 24">
                  <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8 10a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 2z" />
                </svg>
              </div>
              <div>
                <div className="t">Phone / WhatsApp</div>
                <div className="v">+263 (0) 712 421 953</div>
              </div>
            </div>
            <div className="ci-item">
              <div className="ci-ico">
                <svg viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 6L2 7" />
                </svg>
              </div>
              <div>
                <div className="t">Email</div>
                <div className="v">
                  sales@solaris-energy.com
                  <br />
                  support@solaris-energy.com
                </div>
              </div>
            </div>
            <div className="ci-item">
              <div className="ci-ico">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s-7-5.3-7-11a7 7 0 0114 0c0 5.7-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
              </div>
              <div>
                <div className="t">Head office</div>
                <div className="v">
                  63 Douglas Road, Workington
                  <br />
                  Harare · Regional hubs in 15 countries
                </div>
              </div>
            </div>
            <div className="ci-item">
              <div className="ci-ico">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </div>
              <div>
                <div className="t">Working hours</div>
                <div className="v">
                  Mon–Sat · 08:00 – 17:30
                  <br />
                  Emergency support 24/7
                </div>
              </div>
            </div>
          </div>
          <div className="ci-socials">
            <a href="#" aria-label="Facebook">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
              </svg>
            </a>
            <a href="#" aria-label="Twitter / X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.9 2H22l-7 8 8.2 12h-6.4l-5-7.3L6 22H2.9l7.5-8.6L2.5 2H9l4.6 6.7L18.9 2zm-1.1 18h1.7L7.9 3.7H6.1L17.8 20z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.98 3.5A2.5 2.5 0 110 3.5a2.5 2.5 0 014.98 0zM.2 8.4h4.6V24H.2V8.4zm7.6 0h4.4v2.1h.1c.6-1.1 2.1-2.3 4.3-2.3 4.6 0 5.5 3 5.5 7V24h-4.6v-6.9c0-1.6 0-3.8-2.3-3.8s-2.7 1.8-2.7 3.7V24H7.8V8.4z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="query-form rv-r">
          <span className="eyebrow">Send a query to our team</span>
          <h3 style={{ fontSize: 26, marginTop: 6 }}>
            Request your free solar quote
          </h3>
          <form id="queryForm" noValidate onSubmit={handleSubmit}>
            <div className="qf-grid">
              <div className="field">
                <label>First name *</label>
                <input
                  type="text"
                  id="qfFirst"
                  placeholder="Tendai"
                  required
                  ref={firstRef}
                />
                <span className="err">required</span>
              </div>
              <div className="field">
                <label>Last name *</label>
                <input
                  type="text"
                  id="qfLast"
                  placeholder="Moyo"
                  required
                  ref={lastRef}
                />
                <span className="err">required</span>
              </div>
              <div className="field">
                <label>Email *</label>
                <input
                  type="email"
                  id="qfEmail"
                  placeholder="you@email.com"
                  required
                  ref={emailRef}
                />
                <span className="err">valid email required</span>
              </div>
              <div className="field">
                <label>Mobile *</label>
                <input
                  type="tel"
                  id="qfPhone"
                  placeholder="+263 7x xxx xxxx"
                  required
                  ref={phoneRef}
                />
                <span className="err">required</span>
              </div>
              <div className="field">
                <label>Country *</label>
                <select id="qfCountry" required defaultValue="" ref={countryRef}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
                <span className="err">required</span>
              </div>
              <div className="field">
                <label>City</label>
                <input type="text" id="qfCity" placeholder="Harare" ref={cityRef} />
              </div>
              <div className="field">
                <label>Enquiring for *</label>
                <select id="qfType" required defaultValue="" ref={typeRef}>
                  <option value="">Select…</option>
                  {ENQUIRY_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <span className="err">required</span>
              </div>
              <div className="field">
                <label>System type</label>
                <select id="qfSystem" defaultValue="Grid-Tie" ref={systemRef}>
                  {SYSTEM_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label>Your message *</label>
                <textarea
                  id="qfMsg"
                  placeholder="Tell us about your site, monthly bill, and what you'd like to power…"
                  required
                  ref={msgRef}
                ></textarea>
                <span className="err">required</span>
              </div>
            </div>
            <div className="qf-submit">
              <button type="submit" className="btn-primary" id="qfSubmitBtn" ref={submitRef}>
                Submit Query ☀
              </button>
              <p className="qf-privacy">
                🔒 Your details go straight to our admin team and are never
                shared. Response within 24h.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
