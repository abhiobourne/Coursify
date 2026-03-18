"use client";

import { useEffect, useState } from "react";
import { getCourse, getCourseVideos, getVideoNote, Course, CourseVideo } from "@/lib/courses";
import YouTube from "react-youtube";
import { CheckCircle, Circle, PlayCircle, Loader2, Link as LinkIcon, Menu, X, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { saveVideoNote, cloneCourse, getUserCourses } from "@/lib/courses";
import { toast } from "sonner";
import { useRef } from "react";

export default function SharedCoursePlayer() {
    const { id } = useParams();
    const courseId = id as string;
    const { user } = useAuth();
    const router = useRouter();

    const [course, setCourse] = useState<Course | null>(null);
    const [videos, setVideos] = useState<CourseVideo[]>([]);
    const [activeVideo, setActiveVideo] = useState<CourseVideo | null>(null);

    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [note, setNote] = useState("");
    const [isImporting, setIsImporting] = useState(false);

    const editorRef = useRef<any>(null);
    const noteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load Course Data
    useEffect(() => {
        async function loadCourseData() {
            try {
                const c = await getCourse(courseId);
                if (c) {
                    if (c.privacy === 'private' && (!user || user.uid !== c.userId)) {
                        setAccessDenied(true);
                        setLoading(false);
                        return;
                    }
                    const v = await getCourseVideos(courseId);
                    if (v.length > 0) {
                        setCourse(c);
                        setVideos(v);
                        const nextVideo = v.find(vid => !vid.isCompleted) || v[0];
                        setActiveVideo(nextVideo);
                    }
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
                // Fetch current user's note if logged in, otherwise fallback to course owner's note
                let n = null;
                if (user) {
                    n = await getVideoNote(user.uid, activeVideo.id, activeVideo.startTime || 0);
                }
                if (!n) {
                    n = await getVideoNote(course.userId, activeVideo.id, activeVideo.startTime || 0);
                }
                if (n) setNote(n.content);
            } catch (err) {
                console.error(err);
            }
        }
        fetchNote();
    }, [activeVideo, course, user]);

    const handleNoteChange = (content: string) => {
        setNote(content);
        if (!user || !course || !activeVideo) return;

        if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
        noteTimeoutRef.current = setTimeout(() => {
            saveVideoNote(user.uid, course.id, activeVideo.id, content, activeVideo.startTime || 0).catch(console.error);
        }, 1000);
    };

    const handleImportCourse = async () => {
        if (!user) {
            toast.error("Please sign in to add this course to your dashboard.");
            return;
        }
        if (!course) return;

        setIsImporting(true);
        try {
            // Check limits before importing
            const userCourses = await getUserCourses(user.uid);
            const ytCourseCount = userCourses.filter(c => c.sourceUrl !== 'custom').length;
            const customCourseCount = userCourses.filter(c => c.sourceUrl === 'custom').length;

            if (course.sourceUrl === 'custom' && customCourseCount >= 1) {
                toast.error("Free plan limit reached for Custom Courses! Manage space in your Dashboard to add this course.", { duration: 5000 });
                return;
            } else if (course.sourceUrl !== 'custom' && ytCourseCount >= 4) {
                toast.error("Free plan limit reached (4 Courses)! Manage space in your Dashboard to add this course.", { duration: 5000 });
                return;
            }

            const newCourseId = await cloneCourse(course.id, user.uid);
            toast.success("Course added to your dashboard!", {
                style: { background: "#22c55e", color: "#fff", border: "none" }
            });
            router.push(`/course/${newCourseId}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to add course.");
        } finally {
            setIsImporting(false);
        }
    };

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

    if (accessDenied) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-background text-center px-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-muted-foreground hidden" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">This course is private</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                    The creator of this course has set it to private. You don't have permission to view it.
                </p>
                <Link href="/" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Go to Home
                </Link>
            </div>
        );
    }

    if (!course || !activeVideo) {
        return <div className="p-8 text-center text-muted-foreground">Course not found or is private.</div>;
    }

    const progressPercent = course.totalDuration > 0
        ? (course.completedDuration / course.totalDuration) * 100
        : 0;

    return (
        <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-background">

            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between">
                <span className="font-semibold text-foreground truncate pr-4">{course.title}</span>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-muted rounded-lg text-foreground">
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col h-full overflow-y-auto transition-all",
                sidebarOpen ? "hidden md:flex" : "flex"
            )}>

                {/* Breadcrumb & Navigation */}
                <div className="p-4 md:px-8 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-muted-foreground">Shared Course /</span>
                        <span className="text-foreground truncate max-w-[200px] md:max-w-md">{course.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Share2 className="w-3 h-3" /> Shared Preview
                        </span>
                        <button
                            onClick={handleImportCourse}
                            disabled={isImporting}
                            className="text-sm bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to My Courses"}
                        </button>
                    </div>
                </div>

                {/* Video Player Header */}
                <div className="p-4 md:px-8 bg-muted/30">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 line-clamp-2">
                        {activeVideo.title}
                    </h1>

                    {/* YouTube Embed */}
                    <div className="aspect-video w-full max-w-5xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border">
                        <YouTube
                            videoId={activeVideo.id}
                            opts={{
                                width: '100%',
                                height: '100%',
                                playerVars: {
                                    autoplay: 1,
                                    rel: 0,
                                    modestbranding: 1,
                                    start: activeVideo.startTime || 0
                                }
                            }}
                            onEnd={handleVideoEnd}
                            key={`${activeVideo.id}_${activeVideo.startTime || 0}`}
                            className="w-full h-full"
                            iframeClassName="w-full h-full"
                        />
                    </div>
                </div>

                {/* Notes Section */}
                <div className="flex-1 p-4 md:px-8 max-w-5xl mx-auto w-full pb-12">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Course Notes</h2>
                    {user ? (
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
                            <div className="relative">
                                <RichTextEditor
                                    content={note}
                                    onChange={handleNoteChange}
                                    editorRef={editorRef}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-2xl blur opacity-30" />
                            <div className="relative w-full p-6 bg-card border border-border rounded-2xl text-foreground leading-relaxed text-sm tiptap-editor"
                                dangerouslySetInnerHTML={{ __html: note || "<p>No notes available.</p>" }}
                            />
                            <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20 text-sm text-primary flex items-center gap-2">
                                <span className="font-semibold">Want to edit these notes?</span> Sign in and click "Add to My Courses".
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Playlist Sidebar */}
            <div className={cn(
                "w-full md:w-[400px] bg-card border-l border-border flex flex-col h-full",
                sidebarOpen ? "block" : "hidden md:flex"
            )}>
                <div className="p-6 border-b border-border shrink-0 bg-card z-10 flex flex-col gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4 line-clamp-1">{course.title}</h2>
                        <ProgressBar progress={0} size="md" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 relative pb-20 md:pb-4">
                    {videos.map((video, idx) => {
                        const isActive = activeVideo.id === video.id && (activeVideo.startTime || 0) === (video.startTime || 0);
                        return (
                            <button
                                key={`${video.id}_${video.startTime || 0}`}
                                onClick={() => {
                                    setActiveVideo(video);
                                    if (window.innerWidth < 768) setSidebarOpen(false); // Close mobile sidebar on select
                                }}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl flex items-start gap-4 transition-all duration-300 group",
                                    isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-accent border border-transparent"
                                )}
                            >
                                <div className="relative shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-muted">
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
                                            <Circle className="w-3 h-3" />
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
