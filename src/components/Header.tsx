"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSite } from "@/components/SiteProvider";

const NAV_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "#services", label: "Services" },
  { href: "#calculator", label: "Savings Calc" },
  { href: "#projects", label: "Projects" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Contact" },
];

const MOBILE_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "#services", label: "Services" },
  { href: "#calculator", label: "Savings Calculator" },
  { href: "#projects", label: "Projects" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Get Free Quote →", color: "#ffb703" },
];

export default function Header() {
  const { mobileOpen, toggleMobile } = useSite();
  const menuRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    // The first pass only mirrors the CSS pre-state; don't animate on load.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const links = menu.querySelectorAll("a");
    links.forEach((link, i) => {
      gsap.to(link, {
        opacity: mobileOpen ? 1 : 0,
        y: mobileOpen ? 0 : 24,
        delay: mobileOpen ? 0.25 + i * 0.07 : 0,
        duration: 0.5,
      });
    });
  }, [mobileOpen]);

  return (
    <>
      <header id="header">
        <a href="#home" className="logo" data-scroll>
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="8" fill="url(#lg)" />
            <g stroke="url(#lg)" strokeWidth="2.6" strokeLinecap="round">
              <line x1="20" y1="2" x2="20" y2="8" />
              <line x1="20" y1="32" x2="20" y2="38" />
              <line x1="2" y1="20" x2="8" y2="20" />
              <line x1="32" y1="20" x2="38" y2="20" />
              <line x1="7" y1="7" x2="11.5" y2="11.5" />
              <line x1="28.5" y1="28.5" x2="33" y2="33" />
              <line x1="33" y1="7" x2="28.5" y2="11.5" />
              <line x1="11.5" y1="28.5" x2="7" y2="33" />
            </g>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffd166" />
                <stop offset="1" stopColor="#fb8500" />
              </linearGradient>
            </defs>
          </svg>
          SOLAR<em>IS</em>
        </a>
        <nav className="mainnav">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              data-scroll
              className={i === 0 ? "active" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a href="#contact" data-scroll className="nav-cta header-cta">
          Get Free Quote
        </a>
        <button
          id="burger"
          aria-label="Menu"
          className={mobileOpen ? "open" : undefined}
          onClick={toggleMobile}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <div
        id="mobileMenu"
        ref={menuRef}
        className={mobileOpen ? "open" : undefined}
      >
        {MOBILE_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            data-scroll
            style={link.color ? { color: link.color } : undefined}
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}
