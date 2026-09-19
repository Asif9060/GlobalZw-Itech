import Link from "next/link";
import type { ReactNode } from "react";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/leads/types";

/**
 * Server-rendered presentation pieces shared across the admin portal.
 * No client JavaScript — these are static markup.
 */

/* ── status pill ────────────────────────────────────────────────────────── */

const PILL_CLASS: Record<LeadStatus, string> = {
  new: "ad-pill--new",
  in_progress: "ad-pill--progress",
  resolved: "ad-pill--resolved",
};

export function StatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className={`ad-pill ${PILL_CLASS[status]}`}>
      <span className="ad-pill__dot" aria-hidden="true" />
      {LEAD_STATUS_LABEL[status]}
    </span>
  );
}

export function OpenClosedPill({ accepting }: { accepting: boolean }) {
  return (
    <span className={`ad-pill ${accepting ? "ad-pill--open" : "ad-pill--closed"}`}>
      <span className="ad-pill__dot" aria-hidden="true" />
      {accepting ? "Accepting" : "Paused"}
    </span>
  );
}

/* ── stat card ──────────────────────────────────────────────────────────── */

export function Stat({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: string;
  href?: string;
}) {
  const style = accent ? ({ "--ad-accent": accent } as React.CSSProperties) : undefined;

  const body = (
    <>
      <div className="ad-stat__value">{value}</div>
      <div className="ad-stat__label">{label}</div>
      {hint && <div className="ad-stat__hint">{hint}</div>}
    </>
  );

  return href ? (
    <Link className="ad-stat ad-stat--link" href={href} style={style}>
      {body}
    </Link>
  ) : (
    <div className="ad-stat" style={style}>
      {body}
    </div>
  );
}

/* ── empty state ────────────────────────────────────────────────────────── */

export function Empty({
  icon = "📭",
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: ReactNode;
}) {
  return (
    <div className="ad-empty">
      <div className="ad-empty__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="ad-empty__title">{title}</div>
      {hint && <p className="ad-empty__hint">{hint}</p>}
    </div>
  );
}

/* ── banner ─────────────────────────────────────────────────────────────── */

export function Banner({
  tone = "info",
  icon,
  children,
}: {
  tone?: "info" | "warn" | "danger";
  icon?: string;
  children: ReactNode;
}) {
  const toneClass =
    tone === "warn" ? " ad-banner--warn" : tone === "danger" ? " ad-banner--danger" : "";

  return (
    <div className={`ad-banner${toneClass}`} role={tone === "info" ? undefined : "status"}>
      <span className="ad-banner__icon" aria-hidden="true">
        {icon ?? (tone === "danger" ? "⛔" : tone === "warn" ? "⚠️" : "ℹ️")}
      </span>
      <div>{children}</div>
    </div>
  );
}

/* ── section heading ────────────────────────────────────────────────────── */

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="ad-topbar">
      <div>
        <div className="ad-eyebrow">{eyebrow}</div>
        <h1 className="ad-title">{title}</h1>
        {subtitle && <p className="ad-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ad-topbar__actions">{actions}</div>}
    </div>
  );
}
