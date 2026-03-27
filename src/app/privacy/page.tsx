import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl animate-in fade-in duration-500">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Home
            </Link>
            <h1 className="text-3xl font-bold mb-6 text-foreground">Privacy Policy</h1>
            <div className="prose prose-sm md:prose-base dark:prose-invert text-muted-foreground">
                <p>Welcome to CoursifyYT's Privacy Policy.</p>
                <p>We respect your privacy and are committed to protecting it through our compliance with this policy.</p>
                <p>This page is currently a placeholder to prevent 404 errors. Please check back later for the full privacy policy.</p>
            </div>
        </div>
    );
}
