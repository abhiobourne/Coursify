"use client";

import { useState, useEffect } from "react";
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
import { Plus, ListVideo, Loader2, ArrowRight, Settings2, Trash2, Clock, Link as LinkIcon, Youtube } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createCustomCourse, updateCustomCourse, CustomCourseChapter, Course } from "@/lib/courses";
import { toast } from "sonner";

export function AddCourseDialog({
    children,
    isEditing = false,
    courseId,
    initialData,
    initialChapters
}: {
    children?: React.ReactNode,
    isEditing?: boolean,
    courseId?: string,
    initialData?: { title: string, description: string, instructorName?: string },
    initialChapters?: CustomCourseChapter[]
}) {
    const { user } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'import' | 'custom' | null>(isEditing ? 'custom' : null);

    // Import mode state
    const [url, setUrl] = useState("");

    // Custom mode state
    const [customTitle, setCustomTitle] = useState(initialData?.title || "");
    const [customDesc, setCustomDesc] = useState(initialData?.description || "");
    const [customInstructor, setCustomInstructor] = useState(initialData?.instructorName || "");
    const [chapters, setChapters] = useState<CustomCourseChapter[]>(
        initialChapters || [{ title: "Chapter 1", url: "", startTime: 0, videoId: "" }]
    );

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // URL Validation
    const isPlaylistUrl = (url: string) => url.includes('list=') && url.includes('PL');
    const hasInvalidUrl = chapters.some(ch => isPlaylistUrl(ch.url));

    // Sync initial data when entering edit mode, as it might arrive asynchronously
    useEffect(() => {
        if (isEditing && open && courseId && (!chapters || chapters.length === 0 || chapters[0].url === "")) {
            const fetchChapters = async () => {
                setIsLoading(true);
                try {
                    const { getCourseVideos } = await import('@/lib/courses');
                    const videos = await getCourseVideos(courseId);
                    const mappedChapters: CustomCourseChapter[] = videos.map(v => ({
                        title: v.title,
                        url: `https://www.youtube.com/watch?v=${v.id}`,
                        startTime: v.startTime || 0,
                        endTime: v.endTime || 0,
                        videoId: v.id,
                        thumbnailUrl: v.thumbnailUrl,
                        duration: v.duration
                    }));
                    setChapters(mappedChapters);
                } catch (err) {
                    console.error("Failed to fetch chapters for editing:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchChapters();
        }
    }, [isEditing, open, courseId]);

    useEffect(() => {
        if (isEditing) {
            if (initialData?.title) setCustomTitle(initialData.title);
            if (initialData?.description) setCustomDesc(initialData.description);
            if (initialData?.instructorName) setCustomInstructor(initialData.instructorName);
        }
    }, [isEditing, initialData]);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !user) return;

        setIsLoading(true);

        try {
            const { getUserCourses } = await import('@/lib/courses');
            const userCourses = await getUserCourses(user.uid);
            const ytCoursesCount = userCourses.filter(c => c.sourceUrl !== "custom").length;

            if (ytCoursesCount >= 4) {
                toast("Free Plan Limit Reached", {
                    description: "You can only import up to 4 YouTube Courses on the free plan.",
                    action: {
                        label: "View plans",
                        onClick: () => router.push("/pricing")
                    }
                });
                return;
            }

            const creatorName = user.displayName || user.email?.split('@')[0] || "Anonymous";
            const result = await importCourse(user.uid, url, creatorName);
            finalizeCreation(result);
        } catch (err: any) {
            toast.error(err.message || "Failed to import course.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCustom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customTitle || chapters.length === 0 || !user) {
            toast.error("Title and at least one chapter are required.");
            return;
        }

        setIsLoading(true);

        try {
            if (!isEditing) {
                const { getUserCourses } = await import('@/lib/courses');
                const userCourses = await getUserCourses(user.uid);
                const customCoursesCount = userCourses.filter(c => c.sourceUrl === "custom").length;

                if (customCoursesCount >= 1) {
                    toast("Free Plan Limit Reached", {
                        description: "You can only create 1 Custom Course on the free plan.",
                        action: {
                            label: "View plans",
                            onClick: () => router.push("/pricing")
                        }
                    });
                    setIsLoading(false);
                    return;
                }
            }

            // First, we need to ensure all chapters have durations and thumbnails
            const processedChapters = await Promise.all(chapters.map(async (ch) => {
                if (!ch.url) return ch;

                // Use cached results or existing data if we're editing and URL hasn't changed
                const existing = initialChapters?.find(prev => prev.url === ch.url);
                if (isEditing && existing && existing.url === ch.url && existing.videoId) {
                    return {
                        ...ch,
                        videoId: existing.videoId,
                        thumbnailUrl: existing.thumbnailUrl,
                        duration: ch.endTime ? (ch.endTime - (ch.startTime || 0)) : existing.duration
                    };
                }

                try {
                    const res = await fetch('/api/youtube', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: ch.url })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data) {
                            return {
                                ...ch,
                                videoId: data.id,
                                thumbnailUrl: data.thumbnailUrl,
                                duration: ch.endTime ? (ch.endTime - (ch.startTime || 0)) : data.totalDuration
                            };
                        }
                    }
                } catch (e) { }
                const videoIdMatch = ch.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
                const videoId = videoIdMatch ? videoIdMatch[1] : `custom_${Math.random().toString(36).substr(2, 9)}`;
                return { ...ch, videoId, duration: (ch.endTime || 0) - (ch.startTime || 0) || 300 };
            }));

            if (isEditing && courseId) {
                await updateCustomCourse(courseId, customTitle, customDesc, processedChapters, customInstructor);
                finalizeCreation("UPDATED_" + courseId);
            } else {
                const creatorName = user.displayName || user.email?.split('@')[0] || "Anonymous";
                const newCourseId = await createCustomCourse(user.uid, customTitle, customDesc, processedChapters, customInstructor, creatorName);
                finalizeCreation("CREATED_" + newCourseId);
            }
        } catch (err: any) {
            toast.error(err.message || `Failed to ${isEditing ? 'update' : 'create'} custom course.`);
        } finally {
            setIsLoading(false);
        }
    };

    const finalizeCreation = (result: string) => {
        setIsSuccess(true);
        let type = "";
        let isUpdate = result.startsWith("UPDATED_");

        if (result.startsWith("EXISTS_")) type = "Course already exists";
        else if (result.startsWith("CREATED_")) type = "Course created";
        else if (result.startsWith("UPDATED_")) type = "Course updated";

        const id = result.replace("EXISTS_", "").replace("CREATED_", "").replace("UPDATED_", "");

        if (isUpdate) {
            toast.success(`${type}! Redirecting...`, {
                style: { background: "#22c55e", color: "#fff", border: "none" }
            });
        } else {
            toast.success(`${type}! Redirecting...`, {
                style: { background: "#22c55e", color: "#fff", border: "none" }
            });
        }

        setTimeout(() => {
            setOpen(false);
            if (!isEditing) setDialogMode(null);
            router.push(`/course/${id}`);
            if (isEditing) router.refresh();
        }, 1500);
    };

    const addChapter = () => {
        setChapters([...chapters, { title: `Chapter ${chapters.length + 1}`, url: "", startTime: 0 }]);
    };

    const removeChapter = (index: number) => {
        setChapters(chapters.filter((_, i) => i !== index));
    };

    const updateChapter = (index: number, field: keyof CustomCourseChapter, value: any) => {
        const newChapters = [...chapters];
        newChapters[index] = { ...newChapters[index], [field]: value };
        setChapters(newChapters);
    };

    const resetState = () => {
        if (!isEditing) {
            setDialogMode(null);
            setUrl("");
            setCustomTitle("");
            setCustomDesc("");
            setCustomInstructor("");
            setChapters([{ title: "Chapter 1", url: "", startTime: 0, videoId: "" }]);
        }
        setIsSuccess(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) setTimeout(resetState, 300);
        }}>
            {!isEditing && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {children || (
                            <Button className="shrink-0 flex items-center gap-2 rounded-full px-5 py-5 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-300">
                                <Plus className="w-5 h-5 font-bold" />
                                Add Course
                            </Button>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 mt-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-black/10 dark:border-white/10 text-black dark:text-white shadow-xl rounded-2xl p-2">
                        <DropdownMenuItem
                            onClick={() => { setDialogMode('import'); setOpen(true); }}
                            className="flex items-center gap-3 py-3 cursor-pointer rounded-xl px-3 focus:bg-black/5 dark:focus:bg-white/10 focus:text-black dark:focus:text-white transition-all"
                        >
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                <Youtube className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">Import from YouTube</span>
                                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Paste a playlist or video URL</span>
                            </div>
                        </DropdownMenuItem>

                        <div className="h-px bg-black/5 dark:bg-white/10 my-1 mx-2"></div>

                        <DropdownMenuItem
                            onClick={() => { setDialogMode('custom'); setOpen(true); }}
                            className="flex items-center gap-3 py-3 cursor-pointer rounded-xl px-3 focus:bg-black/5 dark:focus:bg-white/10 focus:text-black dark:focus:text-white transition-all"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Settings2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">Build Custom Course</span>
                                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Mix chapters from different videos</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {isEditing && (
                <div onClick={() => setOpen(true)} className="cursor-pointer">
                    {children}
                </div>
            )}

            <DialogContent
                className={cn(
                    "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-2xl rounded-3xl overflow-y-auto max-h-[90vh] transition-all duration-300",
                    dialogMode === 'custom' ? "sm:max-w-2xl" : "sm:max-w-md"
                )}
                onInteractOutside={(e) => {
                    // This prevents click events from tunneling to underlying video elements
                    e.stopPropagation();
                }}
            >
                <DialogHeader className="space-y-3 pb-4 border-b border-black/5 dark:border-white/5">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-black to-black/60 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
                        {isEditing ? "Edit Custom Course" : (dialogMode === 'import' ? "Import Course" : "Custom Course Builder")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/80 text-sm">
                        {isEditing
                            ? "Modify your custom chapters and course details below."
                            : (dialogMode === 'import'
                                ? "Paste a YouTube Playlist or Video URL to create a trackable course."
                                : "Mix and match chapters from different videos to create your own learning path.")}
                    </DialogDescription>
                </DialogHeader>

                {dialogMode === 'import' && (
                    <form onSubmit={handleImport} className="space-y-4 pt-4">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-inner">
                                <div className="pl-4 text-muted-foreground">
                                    <ListVideo className="w-5 h-5" />
                                </div>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="YouTube Playlist or Video URL"
                                    required
                                    className="flex-1 bg-transparent border-none outline-none py-4 px-3 text-foreground placeholder:text-muted-foreground text-sm font-medium"
                                />
                                <div className="pr-2">
                                    <Button
                                        type="submit"
                                        disabled={isLoading || isSuccess || !url}
                                        size="icon"
                                        className="bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black rounded-xl h-10 w-10 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white dark:text-black" /> : <ArrowRight className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {dialogMode === 'custom' && (
                    <form onSubmit={handleCreateCustom} className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Course Title</Label>
                                <Input
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder="Modern Web Development"
                                    className="bg-muted/50 border-border"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Instructor Name</Label>
                                <Input
                                    value={customInstructor}
                                    onChange={(e) => setCustomInstructor(e.target.value)}
                                    placeholder="Jatin Dev"
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Description (Optional)</Label>
                                <textarea
                                    value={customDesc}
                                    onChange={(e) => setCustomDesc(e.target.value)}
                                    placeholder="What will you learn in this course?"
                                    className="flex min-h-[80px] w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary h-20 resize-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Chapters</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addChapter}
                                    className="h-8 rounded-lg gap-1 border-primary/20 text-primary hover:bg-primary/10"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Chapter
                                </Button>
                            </div>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {chapters.map((chapter, index) => (
                                    <div key={index} className="p-4 rounded-xl border border-border bg-muted/30 space-y-3 relative group/item">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {index + 1}
                                            </div>
                                            <Input
                                                value={chapter.title}
                                                onChange={(e) => updateChapter(index, 'title', e.target.value)}
                                                placeholder="Chapter Title"
                                                className="h-8 bg-transparent border-none font-semibold px-0 focus:ring-0"
                                                required
                                            />
                                            {chapters.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeChapter(index)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                    <Input
                                                        value={chapter.url}
                                                        onChange={(e) => updateChapter(index, 'url', e.target.value)}
                                                        placeholder="YouTube Video URL"
                                                        className={cn(
                                                            "pl-9 h-9 text-xs bg-muted/50 border-border",
                                                            isPlaylistUrl(chapter.url) && "border-red-500 focus-visible:ring-red-500"
                                                        )}
                                                        required
                                                    />
                                                </div>
                                                {isPlaylistUrl(chapter.url) && (
                                                    <p className="text-[10px] text-red-500 font-medium ml-1">
                                                        Playlist links are not supported here. Please use individual video links.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        value={chapter.startTime || 0}
                                                        onChange={(e) => updateChapter(index, 'startTime', parseInt(e.target.value))}
                                                        placeholder="Start Sec"
                                                        title="Start time in seconds"
                                                        className="pl-9 h-9 text-xs bg-muted/50 border-border"
                                                    />
                                                </div>
                                                <div className="relative flex-1">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        value={chapter.endTime || 0}
                                                        onChange={(e) => updateChapter(index, 'endTime', parseInt(e.target.value))}
                                                        placeholder="End Sec"
                                                        title="End time in seconds (optional)"
                                                        className="pl-9 h-9 text-xs bg-muted/50 border-border"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={resetState}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || isSuccess || hasInvalidUrl}
                                className="bg-primary px-8 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isEditing ? 'Saving...' : 'Building...'}
                                    </>
                                ) : (isEditing ? 'Save Changes' : 'Create Course')}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
