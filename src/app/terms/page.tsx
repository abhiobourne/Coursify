import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl animate-in fade-in duration-500">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Home
            </Link>
            <h1 className="text-3xl font-bold mb-6 text-foreground">Terms of Service</h1>
            <div className="prose prose-sm md:prose-base dark:prose-invert text-muted-foreground">
                <p>Welcome to CoursifyYT's Terms of Service.</p>
                <p>By using our services, you agree to these terms.</p>
                <p>This page is currently a placeholder to prevent 404 errors. Please check back later for the full terms of service.</p>
            </div>
        </div>
    );
}
