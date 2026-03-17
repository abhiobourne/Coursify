"use client";

import Link from "next/link";
import { PlaySquare, Twitter, Github, Linkedin, Youtube, Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="py-20 border-t border-border bg-card/30 backdrop-blur-sm">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                            <PlaySquare className="w-6 h-6 text-primary" />
                            <span className="font-bold text-xl tracking-tight text-foreground">
                                Coursify<span className="text-primary">YT</span>
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                            The ultimate learning companion for YouTube. Transform any video into a structured learning experience with AI-powered notes and progress tracking.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-widest text-foreground mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
                            <li><Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stories</Link></li>
                            <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-widest text-foreground mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                            <li><Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} CoursifyYT. All rights reserved.</p>
                    <p className="flex items-center gap-1.5">
                        Made with <Heart className="w-3 h-3 text-red-500 fill-current" /> for learners everywhere.
                    </p>
                </div>
            </div>
        </footer>
    );
}
