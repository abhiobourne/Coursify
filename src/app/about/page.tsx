"use client";

import { Footer } from "@/components/ui/Footer";
import { Coffee, Code, Heart, Zap, Globe, Shield } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="pt-[160px] pb-[80px] px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="container mx-auto max-w-4xl text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                        We believe learning should be structured, not scattered.
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                        CoursifyYT was built out of pure frustration. We loved learning from YouTube but hated the chaos. So we fixed it.
                    </p>
                </div>
            </section>

            {/* The Story */}
            <section className="py-[80px] px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="glass-panel p-8 md:p-12 rounded-3xl space-y-8 text-lg text-foreground/80 leading-relaxed border-primary/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Code className="w-64 h-64 text-primary" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl font-bold text-foreground">The Origin Story</h2>
                            <p>
                                It started with a simple problem: trying to learn React from a 12-hour YouTube video.
                                Losing our place, getting distracted by recommendations, and having notes scattered across
                                three different apps made the learning experience painful.
                            </p>
                            <p>
                                YouTube is an incredible resource, arguably the largest educational library in human history.
                                But its interface is designed for entertainment—to keep you watching video after video—not for
                                structured learning and retention.
                            </p>
                            <p>
                                We built CoursifyYT to give learners the best of both worlds: the vast, free knowledge
                                of YouTube wrapped in a premium, distraction-free, and highly functional course player.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-[80px] px-6 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Our DNA</h2>
                        <p className="text-muted-foreground text-lg">The principles that guide every feature we build.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-card p-8 rounded-3xl border border-border/50 hover:border-primary/50 transition-colors shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6 fill-current" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Frictionless</h3>
                            <p className="text-muted-foreground">Learning is hard enough. The tool you use shouldn't be. Paste a link, and start learning instantly.</p>
                        </div>

                        <div className="bg-card p-8 rounded-3xl border border-border/50 hover:border-indigo-500/50 transition-colors shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Focus-First</h3>
                            <p className="text-muted-foreground">We aggressively strip away the noise. No recommendations, no comments, no sidebars. Just you and the material.</p>
                        </div>

                        <div className="bg-card p-8 rounded-3xl border border-border/50 hover:border-pink-500/50 transition-colors shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-6">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Accessible to All</h3>
                            <p className="text-muted-foreground">Education should be free. By layering structure over free public videos, we democratize premium learning experiences.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-[120px] px-6 text-center">
                <div className="glass-panel max-w-3xl mx-auto p-12 rounded-3xl flex flex-col items-center gap-6 bg-primary/5 border-primary/20">
                    <Coffee className="w-12 h-12 text-primary mb-2" />
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built by learners, for learners.</h2>
                    <p className="text-lg text-muted-foreground max-w-xl">
                        Join us in transforming how the internet learns. Open source, community-driven, and relentlessly focused on your success.
                    </p>
                    <div className="flex gap-4 mt-4">
                        <Link href="/feedback" className="btn btn-secondary px-8 py-3">
                            Give Feedback
                        </Link>
                        <Link href="/" className="btn btn-primary px-8 py-3 flex items-center gap-2">
                            <Heart className="w-4 h-4" /> Start Learning
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
