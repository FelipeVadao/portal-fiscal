"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./icons";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("pf_theme", next);
    setTheme(next);
  }

  return (
    <button className="btn-icon" onClick={toggle} title="Alternar tema" aria-label="Alternar tema">
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
