import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "auto";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "auto";
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "auto") return stored;
    return "auto";
  });

  useEffect(() => {
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      document.documentElement.classList.toggle("dark", mq.matches);
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
