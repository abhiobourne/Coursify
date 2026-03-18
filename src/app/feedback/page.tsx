"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { submitReview } from "@/lib/reviews";
import { Star, MessageSquareQuote, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function FeedbackPage() {
    const { user, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (content.trim().length < 10) {
            toast.error("Please write a slightly longer review (min. 10 characters)");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitReview({
                userId: user.uid,
                userName: user.displayName || "Anonymous Learner",
                userPhotoUrl: user.photoURL || undefined,
                rating,
                content: content.trim()
            });

            setIsSubmitted(true);
            toast.success("Thank you for your feedback! It means a lot to us.", {
                style: { background: "#22c55e", color: "#fff", border: "none" }
            });
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center pt-[120px] px-6">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <MessageSquareQuote className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                        We value your thoughts.
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Help us make CoursifyYT the best place to learn on the internet.
                    </p>
                </div>

                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-border shadow-2xl relative overflow-hidden bg-card/60">
                    {!user ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <h2 className="text-2xl font-bold mb-4">Please sign in to drop a review.</h2>
                            <p className="text-muted-foreground mb-8">We want to know who is leaving this awesome feedback!</p>
                            <button
                                onClick={signInWithGoogle}
                                className="btn btn-primary px-8 py-3 flex items-center gap-3 text-lg"
                            >
                                <LogIn className="w-5 h-5" /> Continue with Google
                            </button>
                        </div>
                    ) : isSubmitted ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-500/10">
                                <Star className="w-10 h-10 fill-current" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Review Submitted!</h2>
                            <p className="text-muted-foreground">Thank you for helping us improve. Redirecting you home...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
                            {/* Star Rating */}
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Overall Rating</div>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                        >
                                            <Star
                                                className={cn(
                                                    "w-10 h-10 transition-colors duration-200",
                                                    (hoverRating ? star <= hoverRating : star <= rating)
                                                        ? "fill-primary text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                                                        : "text-muted-foreground/30"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className="text-xs text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
                                    {rating === 5 && "I love it! ❤️"}
                                    {rating === 4 && "Great, but has room for improvement."}
                                    {rating === 3 && "It's okay."}
                                    {rating === 2 && "Not what I expected."}
                                    {rating === 1 && "Terrible experience."}
                                </div>
                            </div>

                            {/* Text Area */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Thoughts</label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-indigo-500/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="relative w-full h-40 bg-background border border-border rounded-xl p-4 text-sm focus:outline-none text-foreground resize-none leading-relaxed transition-colors shadow-inner"
                                        placeholder={`Tell us what you love, what you hate, or what we should build next.\ne.g. "I love the markdown notes, but I wish there was a mobile app..."`}
                                        required
                                        maxLength={500}
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs font-mono text-muted-foreground">
                                        {content.length}/500
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || content.trim().length < 10}
                                className="w-full btn btn-primary py-4 text-lg font-bold shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                                ) : (
                                    "Submit Review"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
