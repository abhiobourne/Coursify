"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { getCourse, getCourseVideos, toggleVideoCompletion, saveVideoNote, getVideoNote, toggleVideoFavorite, Course, CourseVideo } from "@/lib/courses";
import YouTube from "react-youtube";
import { CheckCircle, Circle, PlayCircle, Loader2, Save, ChevronLeft, ChevronRight, Menu, X, Star, Search, Share2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CoursePlayer() {
    const { id } = useParams();
    const courseId = id as string;
    const { user, loading: authLoading } = useAuth();

    const [course, setCourse] = useState<Course | null>(null);
    const [videos, setVideos] = useState<CourseVideo[]>([]);
    const [activeVideo, setActiveVideo] = useState<CourseVideo | null>(null);

    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
    const [copiedShareLink, setCopiedShareLink] = useState(false);
    const [togglingCompletion, setTogglingCompletion] = useState<string | null>(null);

    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [noteSaved, setNoteSaved] = useState(false);
    const noteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const playerRef = useRef<any>(null);
    const editorRef = useRef<any>(null);

    // Load Course Data
    useEffect(() => {
        async function loadCourseData() {
            if (!user) return;
            try {
                let c = await getCourse(courseId);
                let retries = 0;

                // Poll for up to 3 seconds to handle Firebase write latency
                while (!c && retries < 6) {
                    await new Promise(r => setTimeout(r, 500));
                    c = await getCourse(courseId);
                    retries++;
                }

                const v = await getCourseVideos(courseId);
                if (c && v.length > 0) {
                    setCourse(c);
                    setVideos(v);
                    // Find first uncompleted video, or default to first
                    const nextVideo = v.find(vid => !vid.isCompleted) || v[0];
                    setActiveVideo(nextVideo);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (!authLoading) loadCourseData();
    }, [courseId, user, authLoading]);

    // Load Note when active video changes
    useEffect(() => {
        async function fetchNote() {
            if (!user || !activeVideo) return;
            setNote(""); // reset textarea
            try {
                const n = await getVideoNote(user.uid, activeVideo.id);
                if (n) setNote(n.content);
            } catch (err) {
                console.error(err);
            }
        }
        fetchNote();
    }, [activeVideo, user]);

    // Auto-save Note functionality
    const handleNoteChange = (value: string) => {
        setNote(value);
        setNoteSaved(false);

        if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);

        noteTimeoutRef.current = setTimeout(async () => {
            if (!user || !activeVideo) return;
            setSavingNote(true);
            await saveVideoNote(user.uid, courseId, activeVideo.id, value);
            setSavingNote(false);
            setNoteSaved(true);
            setTimeout(() => setNoteSaved(false), 2000);
        }, 1000); // Save after 1s of inactivity
    };

    const handleCaptureTimestamp = () => {
        if (!playerRef.current || !editorRef.current) return;
        const time = playerRef.current.getCurrentTime();
        if (time === undefined) return;

        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        const formattedTime = h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;

        const editor = editorRef.current;
        editor.chain().focus()
            .insertContent(`<br><strong>[${formattedTime}]</strong> `)
            .run();
    };

    const handleVideoEnd = async () => {
        if (!activeVideo || !course) return;

        // Mark as completed if it wasn't
        if (!activeVideo.isCompleted) {
            await toggleCompletion(activeVideo);
        }

        // Auto-play next uncompleted video
        const currentIndex = videos.findIndex(v => v.id === activeVideo.id);
        if (currentIndex < videos.length - 1) {
            setActiveVideo(videos[currentIndex + 1]);
        }
    };

    const toggleCompletion = async (video: CourseVideo) => {
        if (!course || !user || togglingCompletion === video.id) return;
        setTogglingCompletion(video.id);

        const targetStatus = !video.isCompleted;

        // Optimistic UI update
        setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, isCompleted: targetStatus } : v
        ));

        setCourse(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                completedDuration: Math.max(0, Math.min(prev.totalDuration, prev.completedDuration + (targetStatus ? video.duration : -video.duration)))
            }
        });

        if (activeVideo?.id === video.id) {
            setActiveVideo(prev => prev ? { ...prev, isCompleted: targetStatus } : prev);
        }

        try {
            await toggleVideoCompletion(user.uid, course.id, video.id, video.isCompleted, video.duration);
        } catch (err) {
            console.error("Failed to toggle completion", err);
            // Revert on error
            setVideos(prev => prev.map(v =>
                v.id === video.id ? { ...v, isCompleted: !targetStatus } : v
            ));
            if (activeVideo?.id === video.id) {
                setActiveVideo(prev => prev ? { ...prev, isCompleted: !targetStatus } : prev);
            }
        } finally {
            setTogglingCompletion(null);
        }
    };

    const toggleFavorite = async (video: CourseVideo) => {
        if (!user || !course) return;
        const isFav = !!video.isFavorite;

        // Optimistic UI
        setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, isFavorite: !isFav } : v
        ));

        if (activeVideo?.id === video.id) {
            setActiveVideo(prev => prev ? { ...prev, isFavorite: !isFav } : prev);
        }

        try {
            await toggleVideoFavorite(user.uid, course.id, video, isFav);
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        }
    };

    const handleCopyShareLink = () => {
        const link = `${window.location.origin}/shared/${courseId}`;
        navigator.clipboard.writeText(link);
        setCopiedShareLink(true);
        setTimeout(() => setCopiedShareLink(false), 2000);
    };

    if (authLoading || loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!course || !activeVideo) {
        return <div className="p-8 text-center text-zinc-400">Course not found.</div>;
    }

    const progressPercent = course.totalDuration > 0
        ? (course.completedDuration / course.totalDuration) * 100
        : 0;

    return (
        <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">

            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between">
                <span className="font-semibold text-white truncate pr-4">{course.title}</span>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/5 rounded-lg text-white">
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col h-full overflow-y-auto bg-background transition-all",
                sidebarOpen ? "hidden md:flex" : "flex"
            )}>

                {/* Breadcrumb & Navigation */}
                <div className="p-4 md:px-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                            <ChevronLeft className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <span className="text-zinc-700">/</span>
                        <span className="text-white truncate max-w-[200px] md:max-w-md">{course.title}</span>
                    </div>

                    <button
                        onClick={handleCopyShareLink}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all text-sm font-medium group"
                    >
                        {copiedShareLink ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4 group-hover:text-primary transition-colors" />}
                        {copiedShareLink ? "Copied!" : "Share Progress"}
                    </button>
                </div>

                {/* Video Player Header */}
                <div className="p-4 md:px-8 bg-zinc-900/30">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 line-clamp-2">
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
                            onReady={(e) => { playerRef.current = e.target; }}
                            onEnd={handleVideoEnd}
                            className="w-full h-full"
                            iframeClassName="w-full h-full"
                        />
                    </div>

                    <div className="max-w-5xl mx-auto mt-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleCompletion(activeVideo)}
                                disabled={togglingCompletion === activeVideo.id}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
                                    activeVideo.isCompleted
                                        ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
                                    togglingCompletion === activeVideo.id && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {togglingCompletion === activeVideo.id ? <Loader2 className="w-5 h-5 animate-spin" /> : (activeVideo.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />)}
                                {activeVideo.isCompleted ? "Completed" : "Mark as Complete"}
                            </button>

                            <button
                                onClick={() => toggleFavorite(activeVideo)}
                                className={cn(
                                    "flex items-center justify-center p-3 rounded-xl border transition-all duration-300",
                                    activeVideo.isFavorite
                                        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                                        : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                                )}
                                title={activeVideo.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                            >
                                <Star className={cn("w-5 h-5", activeVideo.isFavorite && "fill-current")} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="flex-1 p-4 md:px-8 max-w-5xl mx-auto w-full pb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">My Notes</h2>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            {savingNote && (
                                <span className="text-zinc-400 flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                                </span>
                            )}
                            {noteSaved && (
                                <span className="text-green-400 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Saved to cloud
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="relative group min-h-[300px] h-full">
                        <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <div className="relative h-full">
                            <RichTextEditor
                                content={note}
                                onChange={handleNoteChange}
                                onCaptureTimestamp={handleCaptureTimestamp}
                                editorRef={editorRef}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Playlist Sidebar */}
            <div className={cn(
                "w-full md:w-[400px] bg-zinc-900/50 border-l border-white/5 flex flex-col h-full",
                sidebarOpen ? "block" : "hidden md:flex"
            )}>
                <div className="p-6 border-b border-white/5 shrink-0 glass z-10 flex flex-col gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white mb-4 line-clamp-1">{course.title}</h2>
                        <ProgressBar progress={progressPercent} size="md" />
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="search"
                            value={sidebarSearchQuery}
                            onChange={(e) => setSidebarSearchQuery(e.target.value)}
                            placeholder="Search videos..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 relative pb-20 md:pb-4">
                    {videos.filter(v => v.title.toLowerCase().includes(sidebarSearchQuery.toLowerCase())).map((video, idx) => {
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
