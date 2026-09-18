"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useSmoothScroll } from "@/components/SmoothScrollProvider";
import {
  getQueries,
  getServerQueries,
  subscribeQueries,
  writeQueries,
  type Query,
  type QueryDraft,
  type QueryStatus,
} from "@/lib/queryStore";

export type { Query, QueryDraft, QueryStatus };

type SiteApi = {
  queries: Query[];
  badgeCount: number;
  addQuery: (draft: QueryDraft) => void;
  setQueryStatus: (id: string, status: QueryStatus) => void;
  removeQuery: (id: string) => void;
  clearQueries: () => void;
  toast: string;
  toastVisible: boolean;
  showToast: (message: string) => void;
  successOpen: boolean;
  setSuccessOpen: (open: boolean) => void;
  adminOpen: boolean;
  setAdminOpen: (open: boolean) => void;
  mobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
};

const SiteContext = createContext<SiteApi | null>(null);

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}

export function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function SiteProvider({ children }: { children: ReactNode }) {
  const { scrollTo } = useSmoothScroll();

  /* The query inbox lives in localStorage; the server snapshot is empty. */
  const queries = useSyncExternalStore(
    subscribeQueries,
    getQueries,
    getServerQueries,
  );

  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3600);
  }, []);

  const addQuery = useCallback((draft: QueryDraft) => {
    writeQueries([
      {
        ...draft,
        id: "Q-" + Date.now().toString(36).toUpperCase(),
        status: "new",
        date: new Date().toISOString(),
      },
      ...getQueries(),
    ]);
  }, []);

  const setQueryStatus = useCallback((id: string, status: QueryStatus) => {
    writeQueries(
      getQueries().map((q) => (q.id === id ? { ...q, status } : q)),
    );
  }, []);

  const removeQuery = useCallback((id: string) => {
    writeQueries(getQueries().filter((q) => q.id !== id));
  }, []);

  const clearQueries = useCallback(() => writeQueries([]), []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);

  /* Smooth-scroll every in-page anchor, and close the mobile menu on tap. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.("a[data-scroll]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      event.preventDefault();
      closeMobile();
      scrollTo(href, { offset: -70, duration: 1.5 });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [closeMobile, scrollTo]);

  /* Escape closes the overlays. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAdminOpen(false);
      setSuccessOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const badgeCount = useMemo(
    () => queries.filter((q) => q.status === "new").length,
    [queries],
  );

  const value = useMemo<SiteApi>(
    () => ({
      queries,
      badgeCount,
      addQuery,
      setQueryStatus,
      removeQuery,
      clearQueries,
      toast,
      toastVisible,
      showToast,
      successOpen,
      setSuccessOpen,
      adminOpen,
      setAdminOpen,
      mobileOpen,
      toggleMobile,
      closeMobile,
    }),
    [
      queries,
      badgeCount,
      addQuery,
      setQueryStatus,
      removeQuery,
      clearQueries,
      toast,
      toastVisible,
      showToast,
      successOpen,
      adminOpen,
      mobileOpen,
      toggleMobile,
      closeMobile,
    ],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
