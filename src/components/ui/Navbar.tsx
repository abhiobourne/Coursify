"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, LayoutDashboard, PlaySquare, LineChart, User, Settings, ChevronDown, BookOpen, Globe, Library } from "lucide-react";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Navbar() {
    const { user, signInWithGoogle, logOut } = useAuth();
    const pathname = usePathname();
    const isCourseView = pathname?.startsWith("/course/");
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);

    return (
        <nav className={cn(
            "z-[100] flex items-center justify-between gap-8 px-6 py-3 bg-white/90 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-lg dark:shadow-2xl transition-all duration-300",
            isCourseView
                ? "sticky top-0 w-full rounded-none"
                : "fixed top-6 left-1/2 -translate-x-1/2 rounded-full w-[90%] max-w-5xl"
        )}>
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <PlaySquare className="w-5 h-5 text-primary dark:text-white" />
                <span className="font-bold text-lg tracking-tight text-foreground dark:text-white">
                    Coursify<span className="text-blue-400">YT</span>
                </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
                <Link href="/explore" className="text-sm font-bold text-primary dark:text-blue-400 hover:opacity-80 transition-opacity">Explore</Link>
                <Link href="/#features" className="text-sm font-medium text-foreground/80 dark:text-white/80 hover:text-foreground dark:hover:text-white transition-colors">Features</Link>
                <Link href="/#testimonials" className="text-sm font-medium text-foreground/80 dark:text-white/80 hover:text-foreground dark:hover:text-white transition-colors">Stories</Link>
                <Link href="/pricing" className="text-sm font-medium text-foreground/80 dark:text-white/80 hover:text-foreground dark:hover:text-white transition-colors">Pricing</Link>
                <Link href="/about" className="text-sm font-medium text-foreground/80 dark:text-white/80 hover:text-foreground dark:hover:text-white transition-colors">About</Link>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />
                {user ? (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-all outline-none border border-black/5 dark:border-white/5 group">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || "User"}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-5 h-5 text-black dark:text-white" />
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-64 mt-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-foreground shadow-2xl rounded-3xl p-2 animate-in fade-in zoom-in-95 duration-200 z-[120]"
                            >
                                <DropdownMenuLabel className="font-normal px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-primary/20 p-0.5">
                                            {user.photoURL ? (
                                                <img
                                                    src={user.photoURL}
                                                    alt={user.displayName || "User"}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col space-y-0.5 overflow-hidden">
                                            <p className="text-sm font-bold truncate leading-none">{user.displayName}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10 mx-2" />
                                <div className="p-1 space-y-1">
                                    <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary rounded-xl cursor-pointer py-2.5 px-3 transition-colors text-foreground dark:text-white">
                                        <Link href="/profile" className="flex items-center w-full">
                                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mr-3 group-focus:bg-primary/20">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-sm">Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary rounded-xl cursor-pointer py-2.5 px-3 transition-colors text-foreground dark:text-white">
                                        <Link href="/dashboard" className="flex items-center w-full">
                                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mr-3 group-focus:bg-primary/20">
                                                <LayoutDashboard className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-sm">Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary rounded-xl cursor-pointer py-2.5 px-3 transition-colors text-foreground dark:text-white">
                                        <Link href="/my-courses" className="flex items-center w-full">
                                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mr-3 group-focus:bg-primary/20">
                                                <Library className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-sm">My Courses</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary rounded-xl cursor-pointer py-2.5 px-3 transition-colors text-foreground dark:text-white">
                                        <Link href="/explore" className="flex items-center w-full">
                                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mr-3 group-focus:bg-primary/20">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-sm">Explore</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="focus:bg-zinc-500/10 rounded-xl cursor-pointer py-2.5 px-3 transition-colors text-foreground dark:text-white">
                                        <Link href="/settings" className="flex items-center w-full">
                                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mr-3">
                                                <Settings className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-sm">Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </div>
                                <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10 mx-2" />
                                <div className="p-1">
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowSignOutDialog(true);
                                        }}
                                        className="cursor-pointer text-red-500 dark:text-red-400 focus:text-red-600 dark:focus:text-red-300 focus:bg-red-500/10 rounded-xl py-2.5 px-3 w-full transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mr-3">
                                            <LogOut className="h-4 w-4" />
                                        </div>
                                        <span className="font-bold text-sm">Sign Out</span>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <button
                        onClick={signInWithGoogle}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium text-white dark:text-black bg-primary dark:bg-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        Sign in
                    </button>
                )}
            </div>
            {/* Sign Out Confirmation */}
            {showSignOutDialog && (
                <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                    <AlertDialogContent className="bg-white dark:bg-zinc-950 border border-border shadow-2xl rounded-3xl z-[150]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">Sign Out</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground/80">
                                Are you sure you want to sign out? You will need to sign back in to access your dashboard and courses.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    logOut();
                                    setShowSignOutDialog(false);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Sign Out
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </nav>
    );
}
