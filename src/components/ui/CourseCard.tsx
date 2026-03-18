import Link from "next/link";
import { Course, updateCourseTags } from "@/lib/courses";
import { ProgressBar } from "./ProgressBar";
import { Play, Trash2, Tag, Pencil, Settings, Youtube, Globe, Lock, Shield, Heart, Share2 } from "lucide-react";
import { AddCourseDialog } from "./AddCourseDialog";
import { getCourseVideos, CustomCourseChapter } from "@/lib/courses";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CourseCardProps {
    course: Course;
    onDelete?: (courseId: string) => void;
    disableDelete?: boolean;
    sharedLinkOverride?: string;
    isExploreView?: boolean;
    currentUserId?: string;
    onPrivacyChange?: (courseId: string, privacy: 'private' | 'protected' | 'public') => void;
    onLikeToggle?: (courseId: string) => void;
    isLiked?: boolean;
}

export function CourseCard({
    course,
    onDelete,
    disableDelete,
    sharedLinkOverride,
    isExploreView,
    currentUserId,
    onPrivacyChange,
    onLikeToggle,
    isLiked
}: CourseCardProps) {
    const [tags, setTags] = useState<string[]>(course.tags || []);
    const isCompleted = course.completedDuration >= course.totalDuration;
    const progressPercent = course.totalDuration > 0
        ? (course.completedDuration / course.totalDuration) * 100
        : 0;

    // Format duration (e.g., 1h 30m)
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const [newTag, setNewTag] = useState("");
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTag && newTag.trim() !== "" && !tags.includes(newTag.trim())) {
            const updatedTags = [...tags, newTag.trim()];
            setTags(updatedTags);
            await updateCourseTags(course.id, updatedTags);
            course.tags = updatedTags; // mutate original array for search filtering
            setNewTag("");
            setIsTagDialogOpen(false);
        }
    };

    const courseUrl = sharedLinkOverride || `/course/${course.id}`;

    return (
        <div className="group relative block h-full">
            <div className="glass-panel overflow-hidden h-full flex flex-col relative group-hover:-translate-y-1 transition-all duration-500 hover:shadow-2xl border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-xl">
                <Link href={courseUrl} className="block">
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video overflow-hidden">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                        />

                        {/* Status Overlay */}
                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                            {course.sourceUrl === 'custom' ? (
                                <><Settings className="w-3 h-3" /> Custom</>
                            ) : (
                                <><Youtube className="w-3 h-3 text-red-500" /> YouTube</>
                            )}
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-3 right-3 z-20 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-lg border border-white/10">
                            {formatDuration(course.totalDuration)}
                        </div>
                    </div>
                </Link>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 gap-4">
                    <Link href={courseUrl} className="space-y-1 block">
                        {(course.instructorName || course.sourceUrl !== 'custom') && (
                            <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-primary mb-1">
                                {course.instructorName || "YouTube Course"}
                            </div>
                        )}
                        <h3 className="font-bold text-lg text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                        </h3>
                        {/* Display creator name if in explore view, or if imported */}
                        {(isExploreView || (course.creatorId && course.creatorId !== course.userId)) && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                <span className="opacity-70">By</span>
                                <span className="font-medium text-foreground">{course.creatorName || "Anonymous"}</span>
                            </div>
                        )}
                    </Link>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 py-1">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">Progress</span>
                            <span className="text-xs font-semibold text-foreground">{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">Duration</span>
                            <span className="text-xs font-semibold text-foreground">{formatDuration(course.totalDuration)}</span>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="bg-white/5 dark:bg-white/5 text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded border border-white/5 text-muted-foreground">
                                {tag}
                            </span>
                        ))}
                        {tags.length > 3 && (
                            <span className="text-[9px] font-bold text-muted-foreground/40 self-center">+{tags.length - 3}</span>
                        )}
                        {/* Show imported badge if viewing our own dashboard but we didn't create it */}
                        {!isExploreView && course.creatorId && course.creatorId !== course.userId && (
                            <span className="bg-primary/10 text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded border border-primary/20 text-primary self-center">
                                Imported
                            </span>
                        )}
                    </div>

                    <div className="mt-auto pt-2">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Link href={courseUrl} className="flex items-center gap-1.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                                    Resume
                                </span>
                            </Link>

                            {!disableDelete && !isExploreView && (
                                <div className="flex items-center gap-1 relative z-20">
                                    {/* Privacy Toggle Dropdown */}
                                    {onPrivacyChange && (!course.creatorId || course.creatorId === currentUserId) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className={cn(
                                                        "p-1.5 transition-colors flex items-center justify-center",
                                                        course.privacy === 'public' ? "text-green-500 hover:text-green-400" :
                                                            course.privacy === 'protected' ? "text-yellow-500 hover:text-yellow-400" :
                                                                "text-muted-foreground/40 hover:text-primary"
                                                    )}
                                                    title={`Privacy: ${course.privacy || 'private'}`}
                                                >
                                                    {course.privacy === 'public' ? <Globe className="w-3.5 h-3.5" /> :
                                                        course.privacy === 'protected' ? <Shield className="w-3.5 h-3.5" /> :
                                                            <Lock className="w-3.5 h-3.5" />}
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-950 border border-border shadow-2xl rounded-xl">
                                                <DropdownMenuItem onClick={() => onPrivacyChange(course.id, 'private')} className="flex flex-col items-start px-3 py-2 cursor-pointer focus:bg-primary/10 transition-colors">
                                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                                        <Lock className="w-4 h-4 text-muted-foreground" /> Private
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground mt-0.5">Only you can see this course</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onPrivacyChange(course.id, 'protected')} className="flex flex-col items-start px-3 py-2 cursor-pointer focus:bg-primary/10 transition-colors">
                                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                                        <Share2 className="w-4 h-4 text-yellow-500" /> Link Sharing
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground mt-0.5">Anyone with link can view</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onPrivacyChange(course.id, 'public')} className="flex flex-col items-start px-3 py-2 cursor-pointer focus:bg-primary/10 transition-colors">
                                                    <div className="flex items-center gap-2 font-semibold text-sm">
                                                        <Globe className="w-4 h-4 text-green-500" /> Public (Explore)
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground mt-0.5">Visible to everyone in Explore</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}

                                    <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                                        <DialogTrigger asChild>
                                            <button
                                                className="p-1.5 text-muted-foreground/40 hover:text-primary transition-colors"
                                                title="Add Tag"
                                            >
                                                <Tag className="w-3.5 h-3.5" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent
                                            className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border border-border shadow-2xl rounded-3xl"
                                        >
                                            <DialogHeader className="pb-4 border-b border-border">
                                                <DialogTitle className="text-xl font-bold">Add Tag</DialogTitle>
                                                <DialogDescription className="text-muted-foreground/80">
                                                    Organize your learning path with tags.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleAddTag} className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="name" className="text-right">Tag</Label>
                                                    <Input
                                                        id="name"
                                                        value={newTag}
                                                        onChange={(e) => setNewTag(e.target.value)}
                                                        placeholder="React"
                                                        className="col-span-3"
                                                        autoFocus
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit">Save tag</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    {course.sourceUrl === 'custom' && (
                                        <AddCourseDialog
                                            isEditing={true}
                                            courseId={course.id}
                                            initialData={{
                                                title: course.title,
                                                description: course.description || "",
                                                instructorName: course.instructorName || ""
                                            }}
                                        >
                                            <button
                                                className="p-1.5 text-muted-foreground/40 hover:text-primary transition-colors"
                                                title="Edit Course"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </AddCourseDialog>
                                    )}

                                    {onDelete && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button
                                                    className="p-1.5 text-muted-foreground/40 hover:text-red-500 transition-colors"
                                                    title="Delete Course"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent
                                                className="bg-white dark:bg-zinc-950 border border-border shadow-2xl rounded-3xl"
                                            >
                                                <AlertDialogHeader className="pb-4 border-b border-border">
                                                    <AlertDialogTitle className="text-xl font-bold">Delete Course?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-muted-foreground/80">
                                                        This will permanently remove "{course.title}" and all progress.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => onDelete(course.id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div >
                            )}

                            {isExploreView && (
                                <div className="flex items-center gap-3 relative z-20">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (onLikeToggle) onLikeToggle(course.id);
                                        }}
                                        className="flex items-center gap-1.5 p-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors group/like"
                                    >
                                        <Heart
                                            className={cn(
                                                "w-4 h-4 transition-transform group-hover/like:scale-110",
                                                isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
                                            )}
                                        />
                                        <span className={cn(
                                            "text-xs font-bold pr-1",
                                            isLiked ? "text-red-500" : "text-muted-foreground"
                                        )}>
                                            {course.likes || 0}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Premium border shine */}
                <div className="absolute -inset-px rounded-2xl border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
        </div>
    );
}
