import Link from "next/link";
import { Course, updateCourseTags } from "@/lib/courses";
import { ProgressBar } from "./ProgressBar";
import { Play, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
}

export function CourseCard({ course, onDelete }: CourseCardProps) {
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

    const handleAddTag = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newTag = window.prompt("Enter a new tag (e.g., React, Design):");
        if (newTag && newTag.trim() !== "" && !tags.includes(newTag.trim())) {
            const updatedTags = [...tags, newTag.trim()];
            setTags(updatedTags);
            await updateCourseTags(course.id, updatedTags);
            course.tags = updatedTags; // mutate original array for search filtering
        }
    };

    return (
        <Link href={`/course/${course.id}`} className="group block h-full">
            <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col relative group-hover:-translate-y-1 transition-transform duration-300">

                {/* Thumbnail Container */}
                <div className="relative aspect-video overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                    <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Overlay Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg backdrop-blur-md transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-75">
                            <Play className="w-6 h-6 ml-1" />
                        </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 z-20 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg">
                        {formatDuration(course.totalDuration)}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-2 mb-4">
                        {tags.map((tag, idx) => (
                            <span key={idx} className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-md border border-primary/20">
                                {tag}
                            </span>
                        ))}
                        <button
                            onClick={handleAddTag}
                            className="bg-muted hover:bg-accent text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors border border-border"
                        >
                            <Tag className="w-3 h-3" />
                            Add
                        </button>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between">
                        <div className="flex-1 mr-4">
                            <ProgressBar
                                progress={progressPercent}
                                size="sm"
                            />
                        </div>
                        {onDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors z-30"
                                        title="Delete Course"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the course "{course.title}" and all its associated progress.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDelete(course.id);
                                            }}
                                            className="bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>

                {/* Glow effect on hover */}
                <div className="absolute -inset-px rounded-2xl border border-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
            </div>
        </Link>
    );
}
