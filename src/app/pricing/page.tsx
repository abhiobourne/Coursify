"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function PricingPage() {
    const { user, signInWithGoogle } = useAuth();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background">
            <section className="py-[120px]">
                <div className="text-center mb-[64px] max-w-[800px] mx-auto px-6">
                    <h1 className="text-5xl md:text-[4rem] font-semibold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">Invest in your intellect.</h1>
                    <p className="text-xl text-muted-foreground">Unlock your learning potential with features designed to keep you focused and organized.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto px-6">
                    {/* Basic Plan */}
                    <div className="glass-panel p-12 flex flex-col gap-8 rounded-3xl transition-transform duration-300 hover:-translate-y-2">
                        <div>
                            <h3 className="text-2xl text-[var(--text-muted)] font-medium mb-2">Basic</h3>
                            <div className="text-[3.5rem] font-bold tracking-tight flex items-baseline gap-1">
                                $0 <span className="text-base font-normal text-[var(--text-muted)]">/ forever</span>
                            </div>
                        </div>
                        <ul className="flex flex-col gap-4 mt-4">
                            <li className="flex items-center gap-3 text-[1.05rem]"><div className="text-green-400">✓</div> Up to 4 imported courses</li>
                            <li className="flex items-center gap-3 text-[1.05rem]"><div className="text-green-400">✓</div> 1 Custom mixed course</li>
                            <li className="flex items-center gap-3 text-[1.05rem]"><div className="text-green-400">✓</div> Distraction-free player</li>
                            <li className="flex items-center gap-3 text-[1.05rem]"><div className="text-green-400">✓</div> Manual Markdown notes</li>
                        </ul>
                        <div className="mt-8">
                            <button
                                onClick={() => user ? router.push('/dashboard') : signInWithGoogle()}
                                className="w-full btn btn-secondary py-4 text-lg font-medium"
                            >
                                {user ? "Current Plan" : "Start Learning Free"}
                            </button>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="glass-panel p-12 flex flex-col gap-8 rounded-3xl bg-[var(--pro-card-bg)] border-[var(--pro-card-border)] shadow-[var(--pro-card-shadow)] relative overflow-hidden transition-transform duration-300 hover:-translate-y-2 transform md:scale-105 z-10">
                        {/* Glow effect */}
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />

                        <div className="absolute top-6 right-6">
                            <span className="bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-full">Most Popular</span>
                        </div>

                        <div className="relative">
                            <h3 className="text-2xl text-[var(--text-muted)] font-medium mb-2">Pro</h3>
                            <div className="text-[3.5rem] font-bold tracking-tight flex items-baseline gap-1">
                                $8 <span className="text-base font-normal text-[var(--text-muted)]">/ month</span>
                            </div>
                        </div>
                        <ul className="flex flex-col gap-4 mt-4 relative">
                            <li className="flex items-center gap-3 text-[1.05rem]"><div className="text-indigo-400">✓</div> Unlimited Courses</li>
                            <li className="flex items-center gap-3 text-[1.05rem]"><div className="text-indigo-400">✓</div> Cloud sync across devices</li>
                            <li className="flex items-center gap-3 text-[1.05rem]"><div className="text-indigo-400">✓</div> AI Auto-summaries</li>
                            <li className="flex items-center gap-3 text-[1.05rem]"><div className="text-indigo-400">✓</div> Export notes to Notion/Obsidian</li>
                        </ul>
                        <div className="mt-8 relative">
                            {user ? (
                                <button className="w-full btn btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-2">
                                    <Plus className="w-5 h-5" />
                                    Upgrade to Pro
                                </button>
                            ) : (
                                <button onClick={signInWithGoogle} className="w-full btn btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-2">
                                    <Plus className="w-5 h-5" />
                                    Get Pro Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
