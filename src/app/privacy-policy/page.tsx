"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Welcome to CoursifyYT. We respect your privacy and are committed to protecting your personal data.
                                This privacy policy will inform you as to how we look after your personal data when you visit our website
                                and tell you about your privacy rights and how the law protects you.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Data We Collect</h2>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li><strong>Identity Data:</strong> First name, last name, username or similar identifier, and profile picture.</li>
                                <li><strong>Contact Data:</strong> Email address.</li>
                                <li><strong>Technical Data:</strong> Internet protocol (IP) address, your login data, browser type and version.</li>
                                <li><strong>Profile Data:</strong> Your interests, preferences, feedback, and study activity (heatmap data, course progress).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Data</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to provide our services,
                                manage your account, track your progress on educational videos, and improve our website functionality.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Third-Party Links</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Our website embeds YouTube videos and uses Google Firebase for authentication and database storage. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Data Security</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. Data is stored securely using Firebase's encrypted infrastructure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Your Rights</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Under certain circumstances, you have rights under data protection laws in relation to your personal data. These include the right to request access, correction, erasure (deletion of your account and data), restriction, and transfer.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
