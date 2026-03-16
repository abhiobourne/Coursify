"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { importCourse } from "@/lib/courses";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, ListVideo, Loader2, ArrowRight } from "lucide-react";

export function AddCourseDialog({ children }: { children?: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [open, setOpen] = useState(false);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !user) return;

        setIsLoading(true);
        setError("");

        try {
            const courseId = await importCourse(user.uid, url);
            setOpen(false);
            router.push(`/course/${courseId}`);
        } catch (err: any) {
            setError(err.message || "Failed to import course. Please check the URL.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="shrink-0 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Course
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Import Course</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Paste a YouTube Playlist or Video URL to create a new trackable course.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleImport} className="space-y-4 pt-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex items-center bg-muted/50 border border-border rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
                            <div className="pl-3 text-muted-foreground">
                                <ListVideo className="w-5 h-5" />
                            </div>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://youtube.com/..."
                                required
                                className="flex-1 bg-transparent border-none outline-none py-3 px-3 text-foreground placeholder:text-muted-foreground text-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !url}
                            className="bg-primary hover:opacity-90 transition-opacity"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <ArrowRight className="w-4 h-4 mr-2" />
                            )}
                            Create Course
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
