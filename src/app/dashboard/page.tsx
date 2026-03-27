"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getUserCourses, deleteCourse, getFavoriteVideos, Course, FavoriteVideo, updateCoursePrivacy, getAllPublicCourses, toggleCourseLike, getUserLikedCourseIds } from "@/lib/courses";
import { CourseCard } from "@/components/ui/CourseCard";
import { FavoriteVideoCard } from "@/components/ui/FavoriteVideoCard";
import { AddCourseDialog } from "@/components/ui/AddCourseDialog";
import dynamic from "next/dynamic";
const ActivityHeatmap = dynamic(() => import('@/components/ui/ActivityHeatmap').then(mod => mod.ActivityHeatmap), { ssr: false });
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Trash2, Library, Star, Search as SearchIcon, Globe, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
    const [activeTab, setActiveTab] = useState<'courses' | 'favorites' | 'explore'>('courses');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [exploreCourses, setExploreCourses] = useState<Course[]>([]);
    const [likedCourseIds, setLikedCourseIds] = useState<Set<string>>(new Set());
    const [exploreSortBy, setExploreSortBy] = useState<'recent' | 'liked'>('recent');
    const [exploreLoading, setExploreLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        async function loadCourses() {
            if (user) {
                try {
                    const [userCourses, userFavs] = await Promise.all([
                        getUserCourses(user.uid),
                        getFavoriteVideos(user.uid)
                    ]);
                    setCourses(userCourses);

                    // Filter out favorites for courses that were deleted
                    const validFavs = userFavs.filter(fav => userCourses.some(c => c.id === fav.courseId));
                    setFavorites(validFavs);
                } catch (error) {
                    console.error("Error loading courses:", error);
                } finally {
                    setLoading(false);
                }
            }
        }

        loadCourses();
    }, [user, authLoading, router]);

    useEffect(() => {
        if (activeTab === 'explore' && exploreCourses.length === 0 && user) {
            setExploreLoading(true);
            Promise.all([
                getAllPublicCourses(),
                getUserLikedCourseIds(user.uid)
            ]).then(([publicCourses, likedIds]) => {
                setExploreCourses(publicCourses);
                setLikedCourseIds(new Set(likedIds));
            }).catch(error => {
                console.error("Error loading explore courses:", error);
            }).finally(() => {
                setExploreLoading(false);
            });
        }
    }, [activeTab, exploreCourses.length, user]);

    const handleDeleteCourse = async (courseId: string) => {
        try {
            await deleteCourse(courseId);
            setCourses(prev => prev.filter(c => c.id !== courseId));
            setFavorites(prev => prev.filter(f => f.courseId !== courseId));
            toast.success("Course deleted successfully", {
                style: { background: "#22c55e", color: "#fff", border: "none" }
            });
        } catch (error) {
            console.error("Error deleting course:", error);
            toast.error("Failed to delete course");
        }
    };

    const handlePrivacyChange = async (courseId: string, privacy: 'private' | 'protected' | 'public') => {
        try {
            await updateCoursePrivacy(courseId, privacy);
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, privacy } : c));
            toast.success(`Course privacy updated to ${privacy}`);
        } catch (error) {
            console.error("Error updating privacy:", error);
            toast.error("Failed to update privacy");
        }
    };

    const handleLikeToggle = async (courseId: string) => {
        if (!user) {
            toast.error("Please sign in to like courses");
            return;
        }

        const isLiked = likedCourseIds.has(courseId);
        const newLikedIds = new Set(likedCourseIds);
        if (isLiked) {
            newLikedIds.delete(courseId);
        } else {
            newLikedIds.add(courseId);
        }
        setLikedCourseIds(newLikedIds);

        setExploreCourses(exploreCourses.map(c => {
            if (c.id === courseId) {
                return { ...c, likes: (c.likes || 0) + (isLiked ? -1 : 1) };
            }
            return c;
        }));

        try {
            await toggleCourseLike(courseId, user.uid, isLiked);
        } catch (error) {
            setLikedCourseIds(likedCourseIds);
            setExploreCourses(exploreCourses);
            toast.error("Failed to update like");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8">
                <div className="flex justify-between items-end gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <div className="flex gap-4 border-b border-border pb-px">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="aspect-video w-full rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!user) return null; // Prevent flash before redirect

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">My Learning</h1>
                    <p className="text-muted-foreground">Track and manage your YouTube learning journey.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search courses..."
                            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                        />
                    </div>
                    <AddCourseDialog />
                </div>
            </div>



            <div className="flex items-center gap-4 mb-8 border-b border-border pb-px">
                <button
                    onClick={() => setActiveTab('courses')}
                    className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'courses' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <Library className="w-4 h-4" />
                        My Courses
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'favorites' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Favorite Videos
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('explore')}
                    className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'explore' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                >
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Explore
                    </div>
                </button>
            </div>

            {activeTab === 'courses' && (
                courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center border-dashed border-border hover:border-primary/50 transition-colors">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">No courses found</h2>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            {courses.length === 0 ? "You haven't imported any YouTube playlists or videos yet." : "No courses match your search."}
                        </p>
                        {courses.length === 0 && (
                            <AddCourseDialog>
                                <Button className="px-8 py-6 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    <Plus className="w-6 h-6 mr-2" />
                                    Import Your First Course
                                </Button>
                            </AddCourseDialog>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses
                            .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
                            .map((course, index) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    priority={index < 4}
                                    onDelete={handleDeleteCourse}
                                    onPrivacyChange={handlePrivacyChange}
                                    currentUserId={user?.uid}
                                />
                            ))}
                    </div>
                )
            )}

            {activeTab === 'favorites' && (
                favorites.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center border-dashed border-border hover:border-primary/50 transition-colors">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Star className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">No favorites found</h2>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            {favorites.length === 0 ? "You haven't added any videos to your favorites yet." : "No favorite videos match your search."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites
                            .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((video, index) => (
                                <FavoriteVideoCard key={video.id} video={video} priority={index < 4} />
                            ))}
                    </div>
                )
            )}

            {activeTab === 'explore' && (() => {
                let filtered = exploreCourses.filter(c =>
                    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.instructorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                );

                if (exploreSortBy === 'liked') {
                    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                } else {
                    filtered.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
                }

                return (
                    <div className="space-y-6">
                        <div className="flex bg-muted/50 p-1 rounded-xl w-full sm:w-fit mb-6">
                            <button
                                onClick={() => setExploreSortBy('recent')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${exploreSortBy === 'recent' ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Clock className="w-4 h-4" /> Recent
                            </button>
                            <button
                                onClick={() => setExploreSortBy('liked')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${exploreSortBy === 'liked' ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <TrendingUp className="w-4 h-4" /> Most Liked
                            </button>
                        </div>

                        {exploreLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton className="aspect-video w-full rounded-2xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="glass-card rounded-2xl p-12 text-center border-dashed border-border hover:border-primary/50 transition-colors">
                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Globe className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2">No courses found</h2>
                                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                    {exploreCourses.length === 0 ? "No public courses available yet." : "No courses match your search criteria."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filtered.map((course, index) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        priority={index < 4}
                                        isExploreView={true}
                                        onLikeToggle={handleLikeToggle}
                                        isLiked={likedCourseIds.has(course.id)}
                                        currentUserId={user?.uid}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}
