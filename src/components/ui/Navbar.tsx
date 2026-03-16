"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, LayoutDashboard, PlaySquare, LineChart } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const { user, signInWithGoogle, logOut } = useAuth();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border glass">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <PlaySquare className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-foreground">
                        Coursify<span className="text-primary">YT</span>
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className={cn(
                                    "hidden sm:flex items-center gap-2 px-4 py-2 rounded-full",
                                    "text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                )}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>
                            <Link
                                href="/dashboard/stats"
                                className={cn(
                                    "hidden sm:flex items-center gap-2 px-4 py-2 rounded-full",
                                    "text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                )}
                            >
                                <LineChart className="w-4 h-4" />
                                Stats
                            </Link>
                            <ThemeToggle />
                            <div className="h-8 w-px bg-border hidden sm:block"></div>
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-sm font-medium text-foreground">{user.displayName}</span>
                                </div>
                                {user.photoURL && (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || "User"}
                                        className="w-8 h-8 rounded-full ring-2 ring-primary/20"
                                    />
                                )}
                                <button
                                    onClick={logOut}
                                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                    aria-label="Log out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <button
                                onClick={signInWithGoogle}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-full",
                                    "bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90",
                                    "transition-all duration-300 shadow-lg"
                                )}
                            >
                                <LogIn className="w-4 h-4" />
                                Sign in with Google
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
