"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, LayoutDashboard, PlaySquare, LineChart, User, Settings, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
                                    "text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                                )}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>

                            <ThemeToggle />
                            <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 transition-all outline-none group">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName || "User"}
                                                className="w-8 h-8 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                        )}
                                        <div className="hidden sm:flex items-center gap-1 ml-1">
                                            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                                                {user.displayName?.split(' ')[0]}
                                            </span>
                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 mt-2 glass-card">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none text-foreground">{user.displayName}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer flex items-center">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/stats" className="cursor-pointer flex items-center">
                                            <LineChart className="mr-2 h-4 w-4" />
                                            <span>Learning Stats</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem onClick={logOut} className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
