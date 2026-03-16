import Link from "next/link";
import { PlaySquare, Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-background mt-auto">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                                <PlaySquare className="w-3.5 h-3.5 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-foreground">
                                Coursify<span className="text-primary">YT</span>
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            Transform YouTube playlists into structured learning courses with
                            progress tracking, rich formatting notes, bookmarks, and a distraction-free experience.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Product</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/" className="hover:text-foreground transition-colors">Features</Link></li>
                            <li><Link href="/" className="hover:text-foreground transition-colors">Pricing</Link></li>
                            <li><span className="text-zinc-600 cursor-not-allowed">Changelog</span></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Connect</h3>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} CoursifyYT. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
