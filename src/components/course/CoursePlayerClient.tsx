"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { toggleVideoCompletion, saveVideoNote, getVideoNote, toggleVideoFavorite, recordStudyTime, Course, CourseVideo } from "@/lib/courses";
import YouTube from "react-youtube";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Circle, PlayCircle, Loader2, ChevronLeft, Menu, X, Star, Search, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Link from "next/link";
import { toast } from "sonner";

interface Props {
    course: Course;
    initialVideos: CourseVideo[];
    initialVideoId?: string;
    initialStartTime?: number;
}

export default function CoursePlayerClient({
    course: initialCourse,
    initialVideos,
    initialVideoId,
    initialStartTime
}: Props) {
    const { user } = useAuth();

    const [course, setCourse] = useState<Course>(initialCourse);
    const [videos, setVideos] = useState<CourseVideo[]>(initialVideos);
    const [activeVideo, setActiveVideo] = useState<CourseVideo>(() => {
        if (initialVideoId) {
            const found = initialVideos.find(v => v.id === initialVideoId && (initialStartTime === undefined || (v.startTime || 0) === initialStartTime));
            if (found) return found;
        }
        return initialVideos.find(vid => !vid.isCompleted) || initialVideos[0];
    });

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
    const [togglingCompletion, setTogglingCompletion] = useState<string | null>(null);

    const [note, setNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [noteSaved, setNoteSaved] = useState(false);
    const [theaterMode, setTheaterMode] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const noteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const playerRef = useRef<any>(null);
    const lastVideoIdRef = useRef<string | null>(null);
    const editorRef = useRef<any>(null);
    const processingEndRef = useRef(false);
    const heartbeatSecondsRef = useRef(0);

    // Close sidebar on mobile by default
    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, []);

    // --- Actions & Helpers ---

    const toggleCompletion = useCallback(async (video: CourseVideo) => {
        const videoKey = `${video.id}_${video.startTime || 0}`;
        if (!course || !user || togglingCompletion === videoKey) return;
        setTogglingCompletion(videoKey);

        const targetStatus = !video.isCompleted;

        // Optimistic UI update
        setVideos(prev => prev.map(v =>
            (v.id === video.id && (v.startTime || 0) === (video.startTime || 0)) ? { ...v, isCompleted: targetStatus } : v
        ));

        setCourse(prev => ({
            ...prev,
            completedDuration: Math.max(0, Math.min(prev.totalDuration, prev.completedDuration + (targetStatus ? video.duration : -video.duration)))
        }));

        if (activeVideo?.id === video.id && (activeVideo?.startTime || 0) === (video.startTime || 0)) {
            setActiveVideo(prev => ({ ...prev, isCompleted: targetStatus }));
        }

        try {
            await toggleVideoCompletion(user.uid, course.id, video.id, video.isCompleted, video.duration, video.startTime || 0);
        } catch (err) {
            console.error("Failed to toggle completion", err);
            // Revert on error
            setVideos(prev => prev.map(v =>
                (v.id === video.id && (v.startTime || 0) === (video.startTime || 0)) ? { ...v, isCompleted: !targetStatus } : v
            ));
            if (activeVideo?.id === video.id && (activeVideo?.startTime || 0) === (video.startTime || 0)) {
                setActiveVideo(prev => ({ ...prev, isCompleted: !targetStatus }));
            }
        } finally {
            setTogglingCompletion(null);
        }
    }, [course, user, togglingCompletion, activeVideo]);

    const handleVideoEnd = useCallback(async () => {
        if (!activeVideo || !course || processingEndRef.current) return;
        processingEndRef.current = true;

        try {
            if (!activeVideo.isCompleted) {
                await toggleCompletion(activeVideo);
            }

            const currentIndex = videos.findIndex(v => v.id === activeVideo.id && (v.startTime || 0) === (activeVideo.startTime || 0));
            if (currentIndex !== -1 && currentIndex < videos.length - 1) {
                setActiveVideo(videos[currentIndex + 1]);
            }
        } catch (err) {
            console.error("Error in handleVideoEnd", err);
        } finally {
            processingEndRef.current = false;
        }
    }, [activeVideo, course, videos, toggleCompletion]);

    const handleNoteChange = (value: string) => {
        setNote(value);
        // Only show saving indicator, not the "saved" flash yet
        setNoteSaved(false);

        if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);

        noteTimeoutRef.current = setTimeout(async () => {
            if (!user || !activeVideo) return;
            setSavingNote(true);
            try {
                await saveVideoNote(user.uid, course.id, activeVideo.id, value, activeVideo.startTime || 0);
                setNoteSaved(true);
                // Keep the "Saved" indicator visible for a bit longer but don't flash it every 3s if typing
            } catch (err) {
                console.error("Failed to save note", err);
            } finally {
                setSavingNote(false);
            }
        }, 5000); // Increased to 5s to be less "flickery"
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

    const handleVideoReady = (e: any) => {
        playerRef.current = e.target;
        lastVideoIdRef.current = activeVideo?.id || null;
        e.target.setPlaybackRate(playbackRate);
        if (activeVideo?.startTime) {
            e.target.seekTo(activeVideo.startTime);
        }
    };

    const handleCopyShareLink = () => {
        const link = `${window.location.origin}/shared/${course.id}`;
        navigator.clipboard.writeText(link);
        toast.success("Share link copied to clipboard!");
    };

    const toggleFavorite = async (video: CourseVideo) => {
        if (!user || !course) return;
        const isFav = !!video.isFavorite;

        setVideos(prev => prev.map(v =>
            (v.id === video.id && (v.startTime || 0) === (video.startTime || 0)) ? { ...v, isFavorite: !isFav } : v
        ));

        if (activeVideo?.id === video.id && (activeVideo?.startTime || 0) === (video.startTime || 0)) {
            setActiveVideo(prev => ({ ...prev, isFavorite: !isFav }));
        }

        try {
            await toggleVideoFavorite(user.uid, course.id, video, isFav);
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        }
    };

    // --- Effects ---

    useEffect(() => {
        if (!activeVideo || !user) return;
        processingEndRef.current = false;
        if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);

        const performInitialSeek = () => {
            if (!playerRef.current || lastVideoIdRef.current !== activeVideo.id) return;
            const savedTime = localStorage.getItem(`course_progress_${activeVideo.id}_${activeVideo.startTime || 0}`);
            const targetTime = savedTime ? parseFloat(savedTime) : (activeVideo.startTime || 0);

            try {
                const currentTime = playerRef.current.getCurrentTime();
                if (Math.abs(currentTime - targetTime) > 1) {
                    playerRef.current.seekTo(targetTime);
                }
            } catch (e) {
                console.warn("Seeking failed", e);
            }
        };

        performInitialSeek();

        const interval = setInterval(() => {
            if (playerRef.current && lastVideoIdRef.current === activeVideo.id && playerRef.current.getPlayerState() === 1) {
                const currentTime = playerRef.current.getCurrentTime();
                localStorage.setItem(`course_progress_${activeVideo.id}_${activeVideo.startTime || 0}`, currentTime.toString());

                heartbeatSecondsRef.current += 1;
                if (heartbeatSecondsRef.current >= 10) {
                    recordStudyTime(user.uid, 10);
                    heartbeatSecondsRef.current = 0;
                }

                const endTime = (activeVideo.startTime || 0) + activeVideo.duration;
                if (currentTime >= endTime - 0.5 && !processingEndRef.current) {
                    handleVideoEnd();
                }
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (heartbeatSecondsRef.current >= 10) {
                recordStudyTime(user.uid, heartbeatSecondsRef.current);
                heartbeatSecondsRef.current = 0;
            }
        };
    }, [activeVideo?.id, activeVideo?.startTime, activeVideo?.duration, user, handleVideoEnd]);

    useEffect(() => {
        if (lastVideoIdRef.current !== activeVideo?.id) {
            playerRef.current = null;
            lastVideoIdRef.current = null;
        }
    }, [activeVideo?.id]);

    useEffect(() => {
        async function fetchNote() {
            if (!user || !activeVideo) return;
            setNote("");
            try {
                const n = await getVideoNote(user.uid, activeVideo.id, activeVideo.startTime || 0);
                if (n) setNote(n.content);
            } catch (err) {
                console.error(err);
            }
        }
        fetchNote();
    }, [activeVideo?.id, activeVideo?.startTime, user]);

    // Sync global favorites state on mount to ensure consistency
    useEffect(() => {
        let mounted = true;
        async function syncFavorites() {
            if (!user || !course) return;
            try {
                const { getFavoriteVideos } = await import('@/lib/courses');
                const favs = await getFavoriteVideos(user.uid);
                if (!mounted) return;

                const favIds = new Set(favs.map(f => `${f.courseId}_${f.videoId}_${f.startTime || 0}`));

                setVideos(prev => prev.map(v => {
                    const isFav = favIds.has(`${course.id}_${v.id}_${v.startTime || 0}`);
                    return v.isFavorite !== isFav ? { ...v, isFavorite: isFav } : v;
                }));

                setActiveVideo(prev => {
                    const isFav = favIds.has(`${course.id}_${prev.id}_${prev.startTime || 0}`);
                    return prev.isFavorite !== isFav ? { ...prev, isFavorite: isFav } : prev;
                });
            } catch (err) {
                console.error("Failed to sync favorites", err);
            }
        }
        syncFavorites();
        return () => { mounted = false; };
    }, [user, course?.id, activeVideo.id, activeVideo.startTime]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable) return;
            if (!playerRef.current) return;
            switch (e.key.toLowerCase()) {
                case ' ': e.preventDefault(); const state = playerRef.current.getPlayerState(); if (state === 1) playerRef.current.pauseVideo(); else playerRef.current.playVideo(); break;
                case 'k': const s = playerRef.current.getPlayerState(); if (s === 1) playerRef.current.pauseVideo(); else playerRef.current.playVideo(); break;
                case 'j': playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10); break;
                case 'l': playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10); break;
                case 'f': setTheaterMode(prev => !prev); break;
                case 'm': if (playerRef.current.isMuted()) playerRef.current.unMute(); else playerRef.current.mute(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const progressPercent = course.totalDuration > 0
        ? (course.completedDuration / course.totalDuration) * 100
        : 0;

    const completedCount = videos.filter(v => v.isCompleted).length;
    const totalHours = (course.totalDuration / 3600).toFixed(1);
    const completedHours = (course.completedDuration / 3600).toFixed(1);

    return (
        <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[calc(100dvh-4rem)] overflow-hidden relative">

            {/* Mobile Header (SEO & Visibility) */}
            <header className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex flex-col min-w-0 pr-2">
                    <h1 className="text-sm font-bold text-foreground truncate">{course.title}</h1>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{completedCount}/{videos.length} Lessons Complete</p>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={cn(
                        "p-2 rounded-lg transition-colors",
                        sidebarOpen ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                    )}
                >
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className={cn(
                "flex-1 flex flex-col h-full overflow-y-auto bg-background transition-all duration-300",
            )}>
                {/* Breadcrumb & Navigation */}
                {!theaterMode && (
                    <nav className="hidden md:flex p-4 md:px-8 border-b border-border items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                                <ChevronLeft className="w-4 h-4" />
                                Dashboard
                            </Link>
                            <span className="text-border">/</span>
                            <span className="text-foreground truncate max-w-[200px] md:max-w-md">{course.title}</span>
                        </div>

                        <button
                            onClick={handleCopyShareLink}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all text-sm font-medium group shadow-sm"
                        >
                            <Share2 className="w-4 h-4 group-hover:text-primary transition-colors" />
                            Share Progress
                        </button>
                    </nav>
                )}

                {/* YouTube Embed Area */}
                <section className={cn(
                    "w-full transition-all duration-500 relative group",
                    theaterMode ? "max-w-none bg-black/40 py-4" : "max-w-5xl mx-auto md:mt-4 px-0 md:px-0"
                )}>
                    <div className={cn(
                        "aspect-video w-full bg-black md:rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ring-1 ring-border relative",
                        theaterMode && "rounded-none ring-0 shadow-none border-y border-border"
                    )}>
                        <YouTube
                            videoId={activeVideo.id}
                            opts={{
                                width: '100%',
                                height: '100%',
                                playerVars: {
                                    autoplay: 1,
                                    rel: 0,
                                    modestbranding: 1,
                                    start: activeVideo.startTime || 0,
                                    origin: typeof window !== 'undefined' ? window.location.origin : ''
                                }
                            }}
                            onReady={handleVideoReady}
                            onEnd={handleVideoEnd}
                            key={activeVideo.id}
                            className="w-full h-full"
                            iframeClassName="w-full h-full"
                        />
                    </div>

                    {/* Player Controls Bar */}
                    <div className={cn(
                        "flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 md:px-0",
                        theaterMode && "max-w-5xl mx-auto"
                    )}>
                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            <select
                                className="bg-card border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none h-10 min-w-[70px]"
                                value={playbackRate}
                                onChange={(e) => {
                                    const rate = parseFloat(e.target.value);
                                    setPlaybackRate(rate);
                                    playerRef.current?.setPlaybackRate(rate);
                                }}
                            >
                                <option value="0.5">0.5x</option>
                                <option value="1">1.0x</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2">2.0x</option>
                            </select>
                            <button
                                onClick={() => setTheaterMode(!theaterMode)}
                                className={cn(
                                    "p-2 rounded-lg border transition-all h-10 w-10 flex items-center justify-center",
                                    theaterMode ? "bg-primary/20 text-primary border-primary/30" : "bg-card border-border text-muted-foreground hover:text-foreground"
                                )}
                                title="Theater Mode (F)"
                            >
                                <div className={cn("w-5 h-4 border-2 rounded", theaterMode ? "border-primary" : "border-muted-foreground")} />
                            </button>
                            <div className="md:hidden flex-1" /> {/* Spacer for mobile */}
                            <button
                                onClick={handleCopyShareLink}
                                className="md:hidden p-2 rounded-lg border bg-card border-border text-muted-foreground h-10 w-10 flex items-center justify-center"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => toggleCompletion(activeVideo)}
                                disabled={togglingCompletion === `${activeVideo.id}_${activeVideo.startTime || 0}`}
                                className={cn(
                                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 h-10 rounded-xl font-medium transition-all duration-300 text-sm",
                                    activeVideo.isCompleted
                                        ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
                                    togglingCompletion === `${activeVideo.id}_${activeVideo.startTime || 0}` && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {togglingCompletion === `${activeVideo.id}_${activeVideo.startTime || 0}` ? <Loader2 className="w-4 h-4 animate-spin" /> : (activeVideo.isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />)}
                                {activeVideo.isCompleted ? "Completed" : "Mark Complete"}
                            </button>

                            <button
                                onClick={() => toggleFavorite(activeVideo)}
                                className={cn(
                                    "flex items-center justify-center h-10 w-10 rounded-xl border transition-all duration-300",
                                    activeVideo.isFavorite
                                        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                                )}
                                title={activeVideo.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                            >
                                <Star className={cn("w-5 h-5", activeVideo.isFavorite && "fill-current")} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Notes Section Area */}
                <article className={cn(
                    "flex-1 p-4 md:px-8 max-w-5xl mx-auto w-full pb-12 transition-all duration-500",
                    theaterMode ? "mt-12" : "mt-0"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-foreground">My Study Notes</h2>
                                {course.instructorName && (
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        by {course.instructorName}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Capture thoughts and timestamps for this lesson.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            {savingNote && <span className="text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
                            {noteSaved && <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved to cloud</span>}
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
                        <div className="relative">
                            <RichTextEditor
                                content={note}
                                onChange={handleNoteChange}
                                onCaptureTimestamp={handleCaptureTimestamp}
                                editorRef={editorRef}
                            />
                        </div>
                    </div>
                </article>
            </main>

            {/* Playlist Sidebar */}
            <aside className={cn(
                "fixed md:relative inset-y-0 right-0 w-[85%] md:w-[400px] bg-card border-l border-border flex flex-col h-full z-[60] transform transition-transform duration-300 ease-in-out",
                sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 hidden md:flex"
            )}>
                <div className="p-6 border-b border-border shrink-0 glass z-10 flex flex-col gap-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-bold text-foreground line-clamp-1">{course.title}</h2>
                            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-muted">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/50 rounded-xl p-3 border border-border">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Progress</p>
                                <p className="text-sm font-bold text-foreground">{completedCount}/{videos.length}</p>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3 border border-border">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Time</p>
                                <p className="text-sm font-bold text-foreground">{completedHours}/{totalHours}h</p>
                            </div>
                        </div>

                        <ProgressBar progress={progressPercent} size="md" />
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="search"
                            value={sidebarSearchQuery}
                            onChange={(e) => setSidebarSearchQuery(e.target.value)}
                            placeholder="Search videos..."
                            className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 relative pb-20 md:pb-4">
                    {videos.filter(v => v.title.toLowerCase().includes(sidebarSearchQuery.toLowerCase())).map((video, idx) => {
                        const isActive = activeVideo.id === video.id && (activeVideo.startTime || 0) === (video.startTime || 0);
                        return (
                            <button
                                key={`${video.id}_${video.startTime || 0}`}
                                onClick={() => {
                                    setActiveVideo(video);
                                    if (window.innerWidth < 768) setSidebarOpen(false);
                                }}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl flex items-start gap-4 transition-all duration-300 group",
                                    isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-accent border border-transparent"
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
                                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                                        {video.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            {video.isCompleted ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Circle className="w-3 h-3" />}
                                            {Math.floor(video.duration / 60)}m {video.duration % 60}s
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
}
