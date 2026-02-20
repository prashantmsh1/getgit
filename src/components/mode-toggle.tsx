"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  // Use a state to prevent hydration mismatch for the current theme,
  // but simpler to just use generic Toggle if we don't care. To avoid hydration errors purely:
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="dark:border-deep-space-blue-800/30 dark:bg-deep-space-blue-100/40 relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/50 shadow-sm transition-colors">
        <span className="sr-only">Loading Theme Toggle</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="dark:border-deep-space-blue-800/30 dark:bg-deep-space-blue-100/40 dark:hover:bg-deep-space-blue-100/60 relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-100"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 text-amber-500 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 text-sky-400 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
