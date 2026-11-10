"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ModeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`relative h-9 w-9 rounded-full border border-border bg-card/60 shadow-xs ${className ?? ""}`}
        aria-label="Toggle theme"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative h-9 w-9 shrink-0 rounded-full border border-border bg-card/60 transition-colors hover:bg-accent hover:text-accent-foreground ${className ?? ""}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className="h-[1.15rem] w-[1.15rem] scale-100 rotate-0 text-amber-500 transition-transform duration-200 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.15rem] w-[1.15rem] scale-0 rotate-90 text-sky-400 transition-transform duration-200 dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
