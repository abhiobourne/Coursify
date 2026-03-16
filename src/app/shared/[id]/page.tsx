"use client";

import { useEffect, useState } from "react";
import { getCourse, getCourseVideos, getVideoNote, Course, CourseVideo } from "@/lib/courses";
import YouTube from "react-youtube";
import { CheckCircle, Circle, PlayCircle, Loader2, Link as LinkIcon, Menu, X, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SharedCoursePlayer() {
    const { id } = useParams();
    const courseId = id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [videos, setVideos] = useState<CourseVideo[]>([]);
    const [activeVideo, setActiveVideo] = useState<CourseVideo | null>(null);

    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [note, setNote] = useState("");

    // Load Course Data
    useEffect(() => {
        async function loadCourseData() {
            try {
                const c = await getCourse(courseId);
                const v = await getCourseVideos(courseId);
                if (c && v.length > 0) {
                    setCourse(c);
                    setVideos(v);
                    const nextVideo = v.find(vid => !vid.isCompleted) || v[0];
                    setActiveVideo(nextVideo);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadCourseData();
    }, [courseId]);

    // Load Note when active video changes
    useEffect(() => {
        async function fetchNote() {
            if (!course || !activeVideo) return;
            setNote(""); // reset
            try {
                const n = await getVideoNote(course.userId, activeVideo.id);
                if (n) setNote(n.content);
            } catch (err) {
                console.error(err);
            }
        }
        fetchNote();
    }, [activeVideo, course]);

    const handleVideoEnd = () => {
        if (!activeVideo || !course) return;
        const currentIndex = videos.findIndex(v => v.id === activeVideo.id);
        if (currentIndex < videos.length - 1) {
            setActiveVideo(videos[currentIndex + 1]);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!course || !activeVideo) {
        return <div className="p-8 text-center text-zinc-400">Course not found or is private.</div>;
    }

    const progressPercent = course.totalDuration > 0
        ? (course.completedDuration / course.totalDuration) * 100
        : 0;

    return (
        <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-background">

            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden bg-zinc-900 border-b border-border p-4 flex items-center justify-between">
                <span className="font-semibold text-foreground truncate pr-4">{course.title}</span>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/5 rounded-lg text-foreground">
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col h-full overflow-y-auto transition-all",
                sidebarOpen ? "hidden md:flex" : "flex"
            )}>

                {/* Breadcrumb & Navigation */}
                <div className="p-4 md:px-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-muted-foreground">Shared Course /</span>
                        <span className="text-foreground truncate max-w-[200px] md:max-w-md">{course.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Share2 className="w-3 h-3" /> Read Only
                        </span>
                        <Link href="/" className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/10">
                            Get CoursifyYT
                        </Link>
                    </div>
                </div>

                {/* Video Player Header */}
                <div className="p-4 md:px-8 bg-zinc-900/30">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 line-clamp-2">
                        {activeVideo.title}
                    </h1>

                    {/* YouTube Embed */}
                    <div className="aspect-video w-full max-w-5xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <YouTube
                            videoId={activeVideo.id}
                            opts={{
                                width: '100%',
                                height: '100%',
                                playerVars: { autoplay: 1, rel: 0, modestbranding: 1 }
                            }}
                            onEnd={handleVideoEnd}
                            className="w-full h-full"
                            iframeClassName="w-full h-full"
                        />
                    </div>
                </div>

                {/* Notes Section - Read Only */}
                {note && note.trim() !== '<p></p>' && (
                    <div className="flex-1 p-4 md:px-8 max-w-5xl mx-auto w-full pb-12">
                        <h2 className="text-xl font-semibold text-foreground mb-4">Shared Notes</h2>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-2xl blur opacity-30" />
                            <div className="relative w-full p-6 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-300 leading-relaxed text-sm tiptap-editor"
                                dangerouslySetInnerHTML={{ __html: note }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Playlist Sidebar */}
            <div className={cn(
                "w-full md:w-[400px] bg-zinc-900/50 border-l border-border flex flex-col h-full",
                sidebarOpen ? "block" : "hidden md:flex"
            )}>
                <div className="p-6 border-b border-border shrink-0 glass z-10 flex flex-col gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4 line-clamp-1">{course.title}</h2>
                        <ProgressBar progress={progressPercent} size="md" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 relative pb-20 md:pb-4">
                    {videos.map((video, idx) => {
                        const isActive = activeVideo.id === video.id;
                        return (
                            <button
                                key={video.id}
                                onClick={() => {
                                    setActiveVideo(video);
                                    if (window.innerWidth < 768) setSidebarOpen(false); // Close mobile sidebar on select
                                }}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl flex items-start gap-4 transition-all duration-300 group",
                                    isActive ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="relative shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-zinc-800">
                                    <img src={video.thumbnailUrl} alt="" className={cn(
                                        "w-full h-full object-cover transition-transform duration-500",
                                        !isActive && "group-hover:scale-110"
                                    )} />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlayCircle className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 pr-2">
                                    <p className={cn(
                                        "text-sm font-medium mb-1 line-clamp-2 leading-tight",
                                        isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
                                    )}>
                                        <span className="text-zinc-500 mr-2">{idx + 1}.</span>
                                        {video.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            {video.isCompleted ? (
                                                <CheckCircle className="w-3 h-3 text-green-400" />
                                            ) : (
                                                <Circle className="w-3 h-3" />
                                            )}
                                            {Math.floor(video.duration / 60)}m {video.duration % 60}s
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
