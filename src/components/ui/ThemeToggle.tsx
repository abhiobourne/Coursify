"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center text-neutral-500 dark:text-neutral-400 group"
            aria-label="Toggle theme"
        >
            <Sun className="h-5 w-5 dark:hidden transition-colors group-hover:text-black" />
            <Moon className="h-5 w-5 hidden dark:block transition-colors group-hover:text-white" />
        </button>
    );
}
