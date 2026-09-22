"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "mk-theme";

/* The theme lives on <html data-theme>. A tiny external store lets React hydrate
   with the server value ("dark") and then switch to whatever the pre-hydration
   script applied, without a hydration mismatch. */
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getSnapshot = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const getServerSnapshot = (): Theme => "dark";
function writeTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(STORAGE_KEY, t); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

type Ctx = { theme: Theme; toggle: (e?: MouseEvent<HTMLElement>) => void };
const ThemeContext = createContext<Ctx>({ theme: "dark", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((e?: MouseEvent<HTMLElement>) => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const apply = () => writeTheme(next);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches || !e) return apply();
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = doc.startViewTransition(apply);
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

/** Inline script run before hydration so the stored theme applies without a flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}})();`;
