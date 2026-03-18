"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background text-foreground py-24 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Home
                </Link>

                <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing or using CoursifyYT (the "Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Description of Service</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                CoursifyYT provides a structured platform to organize, view, and track progress on educational YouTube videos and playlists. The Service allows users to create notes, track study time, and optionally share curations ("courses") with others.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Intellectual Property & YouTube Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                CoursifyYT does not host, curate, or own the video content. All video content is hosted by YouTube and embedded via their official APIs. By using our Service, you also agree to be bound by the YouTube Terms of Service. You are responsible for ensuring your use of third-party content is lawful.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. User Guidelines and Rules</h2>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>You may not use the Service for any illegal or unauthorized purpose.</li>
                                <li>You must not transmit any worms, viruses, or any code of a destructive nature.</li>
                                <li>You must not abuse, harass, threaten, or impersonate other users.</li>
                                <li><strong>Public Curation:</strong> If you choose to share your courses publicly (Explore), you agree only to share educational or productive content. We hold the right to remove public listings that violate these principles.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Termination</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
