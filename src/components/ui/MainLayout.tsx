"use client";

import { usePathname } from "next/navigation";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isCourseView = pathname?.startsWith("/course/");

    return (
        <main className={`flex-1 flex flex-col ${isCourseView ? "" : "pt-24"}`}>
            {children}
        </main>
    );
}
