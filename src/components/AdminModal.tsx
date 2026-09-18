"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { gsap } from "@/lib/gsap";
import {
  downloadFile,
  useSite,
  type Query,
  type QueryStatus,
} from "@/components/SiteProvider";

const ADMIN_PIN = "solar123";

const STATUS_LABEL: Record<QueryStatus, string> = {
  new: "NEW",
  progress: "IN PROGRESS",
  resolved: "RESOLVED",
};

const STATUS_CLASS: Record<QueryStatus, string> = {
  new: "st-new",
  progress: "st-progress",
  resolved: "st-resolved",
};

export default function AdminModal() {
  const {
    adminOpen,
    setAdminOpen,
    queries,
    setQueryStatus,
    removeQuery,
    clearQueries,
    showToast,
  } = useSite();

  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  /* open animation + focus the PIN box */
  useEffect(() => {
    if (!adminOpen) return;
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { y: 40, scale: 0.96 },
        { y: 0, scale: 1, duration: 0.5, ease: "power3.out" },
      );
    }
    const focusTimer = setTimeout(() => {
      if (!unlocked) pinRef.current?.focus();
    }, 300);
    return () => clearTimeout(focusTimer);
  }, [adminOpen, unlocked]);

  /* stats slide in once the panel is revealed */
  useEffect(() => {
    if (!adminOpen || !unlocked) return;
    const modal = modalRef.current;
    if (!modal) return;
    gsap.from(modal.querySelectorAll(".adm-stat"), {
      y: 24,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "power3.out",
    });
  }, [adminOpen, unlocked]);

  const tryUnlock = () => {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current.querySelector(".pin-row"),
          { x: -10 },
          { x: 0, duration: 0.5, ease: "elastic.out(1,.3)" },
        );
      }
    }
  };

  const onBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setAdminOpen(false);
  };

  const exportJson = () => {
    downloadFile(
      "solaris-queries.json",
      JSON.stringify(queries, null, 2),
      "application/json",
    );
    showToast("⬇ solaris-queries.json downloaded.");
  };

  const exportCsv = () => {
    const rows = [
      [
        "ID",
        "Date",
        "Name",
        "Email",
        "Phone",
        "Country",
        "City",
        "Type",
        "System",
        "Status",
        "Message",
      ],
    ].concat(
      queries.map((q: Query) => [
        q.id,
        q.date,
        q.first + " " + q.last,
        q.email,
        q.phone,
        q.country,
        q.city,
        q.type,
        q.system,
        q.status,
        '"' + q.message.replace(/"/g, '""') + '"',
      ]),
    );
    downloadFile(
      "solaris-queries.csv",
      rows.map((row) => row.join(",")).join("\n"),
      "text/csv",
    );
    showToast("⬇ solaris-queries.csv downloaded.");
  };

  const onClearAll = () => {
    if (confirm("Delete ALL queries? This cannot be undone.")) {
      clearQueries();
      showToast("All queries cleared.");
    }
  };

  const stats = {
    total: queries.length,
    next: queries.filter((q) => q.status === "new").length,
    resolved: queries.filter((q) => q.status === "resolved").length,
  };

  return (
    <div
      className={`modal-veil${adminOpen ? " open" : ""}`}
      id="adminVeil"
      onClick={onBackdropClick}
    >
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h3>🛡 Admin Portal</h3>
          <button
            className="modal-close"
            id="adminClose"
            onClick={() => setAdminOpen(false)}
          >
            ✕
          </button>
        </div>
        {!unlocked && (
          <div id="pinGate">
            <div className="pin-box">
              <p>Enter the admin PIN to view customer queries.</p>
              <div className="pin-row">
                <input
                  type="password"
                  id="pinInput"
                  placeholder="••••••••"
                  ref={pinRef}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
                />
                <button
                  className="btn-primary"
                  id="pinGo"
                  style={{ padding: "14px 26px" }}
                  onClick={tryUnlock}
                >
                  Unlock
                </button>
              </div>
              <div
                className="pin-err"
                id="pinErr"
                style={pinError ? { display: "block" } : undefined}
              >
                Incorrect PIN. Try again.
              </div>
              <div className="pin-hint">
                Demo PIN: <b>solar123</b>
              </div>
            </div>
          </div>
        )}
        {unlocked && (
          <div id="adminPanel">
            <div className="adm-stats">
              <div className="adm-stat">
                <div className="v" id="admTotal">
                  {stats.total}
                </div>
                <div className="l">Total queries</div>
              </div>
              <div className="adm-stat">
                <div className="v" id="admNew">
                  {stats.next}
                </div>
                <div className="l">New</div>
              </div>
              <div className="adm-stat">
                <div className="v" id="admResolved">
                  {stats.resolved}
                </div>
                <div className="l">Resolved</div>
              </div>
            </div>
            <div className="adm-toolbar">
              <button id="exportJson" onClick={exportJson}>
                ⬇ Export JSON
              </button>
              <button id="exportCsv" onClick={exportCsv}>
                ⬇ Export CSV
              </button>
              <button
                id="clearAll"
                style={{ borderColor: "rgba(255,107,107,.4)", color: "#ff8787" }}
                onClick={onClearAll}
              >
                🗑 Clear all
              </button>
            </div>
            <div id="queryList">
              {queries.length === 0 ? (
                <div className="q-empty">
                  📭 No queries yet. Submitted queries from the contact form will
                  appear here.
                </div>
              ) : (
                queries.map((q, i) => {
                  const d = new Date(q.date);
                  return (
                    <div
                      className="q-card"
                      key={q.id}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <div className="qtop">
                        <div>
                          <h4>
                            {q.first} {q.last}{" "}
                            <span
                              style={{
                                color: "var(--muted)",
                                fontWeight: 400,
                                fontSize: 12,
                              }}
                            >
                              · {q.id}
                            </span>
                          </h4>
                          <div className="qmeta">
                            <span>✉ {q.email}</span>
                            <span>☎ {q.phone}</span>
                            <span>
                              📍 {q.city ? q.city + ", " : ""}
                              {q.country}
                            </span>
                            <span>
                              🕑 {d.toLocaleDateString()}{" "}
                              {d.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <span className={`status-pill ${STATUS_CLASS[q.status]}`}>
                          {STATUS_LABEL[q.status]}
                        </span>
                      </div>
                      <div className="qmeta" style={{ marginTop: 10 }}>
                        <span className="case-tag" style={{ margin: 0 }}>
                          {q.type}
                        </span>
                        <span
                          className="case-tag"
                          style={{
                            margin: 0,
                            borderColor: "rgba(61,220,132,.4)",
                            color: "var(--green)",
                          }}
                        >
                          {q.system}
                        </span>
                      </div>
                      <div className="qmsg">{q.message}</div>
                      <div className="qactions">
                        <select
                          data-id={q.id}
                          className="statusSel"
                          value={q.status}
                          onChange={(e) => {
                            setQueryStatus(q.id, e.target.value as QueryStatus);
                            showToast(
                              "Status updated → " + e.target.value.toUpperCase(),
                            );
                          }}
                        >
                          <option value="new">New</option>
                          <option value="progress">In progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <a
                          href={`mailto:${q.email}`}
                          style={{
                            fontSize: 12,
                            color: "var(--gold)",
                            border: "1px solid rgba(255,183,3,.4)",
                            borderRadius: 8,
                            padding: "7px 14px",
                          }}
                        >
                          ✉ Reply
                        </a>
                        <button
                          className="q-del"
                          data-id={q.id}
                          onClick={() => {
                            removeQuery(q.id);
                            showToast("Query deleted.");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
