"use client";

import { useEffect, useState } from "react";
import { getAllPublicCourses, Course, toggleCourseLike, getUserLikedCourseIds } from "@/lib/courses";
import { CourseCard } from "@/components/ui/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Search as SearchIcon, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ExploreCourses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [likedCourseIds, setLikedCourseIds] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<'recent' | 'liked'>('recent');

    useEffect(() => {
        async function loadCourses() {
            try {
                const publicCourses = await getAllPublicCourses();
                setCourses(publicCourses);

                if (user) {
                    const likedIds = await getUserLikedCourseIds(user.uid);
                    setLikedCourseIds(new Set(likedIds));
                }
            } catch (error) {
                console.error("Error loading courses:", error);
            } finally {
                setLoading(false);
            }
        }
        loadCourses();
    }, [user]);

    const handleLikeToggle = async (courseId: string) => {
        if (!user) {
            toast.error("Please sign in to like courses");
            return;
        }

        const isLiked = likedCourseIds.has(courseId);

        // Optimistic UI update
        const newLikedIds = new Set(likedCourseIds);
        if (isLiked) {
            newLikedIds.delete(courseId);
        } else {
            newLikedIds.add(courseId);
        }
        setLikedCourseIds(newLikedIds);

        setCourses(courses.map(c => {
            if (c.id === courseId) {
                return { ...c, likes: (c.likes || 0) + (isLiked ? -1 : 1) };
            }
            return c;
        }));

        try {
            await toggleCourseLike(courseId, user.uid, isLiked);
        } catch (error) {
            // Revert on failure
            setLikedCourseIds(likedCourseIds);
            setCourses(courses);
            toast.error("Failed to update like");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8">
                <div className="flex justify-between items-end gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

    let filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (sortBy === 'liked') {
        filteredCourses.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
        filteredCourses.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    }

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 tracking-tight">Explore</h1>
                    <p className="text-muted-foreground text-lg">Discover and import learning paths shared by the community.</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex bg-muted/50 p-1 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setSortBy('recent')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'recent' ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Clock className="w-4 h-4" /> Recent
                        </button>
                        <button
                            onClick={() => setSortBy('liked')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'liked' ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <TrendingUp className="w-4 h-4" /> Most Liked
                        </button>
                    </div>
                    <div className="relative w-full md:w-64 lg:w-80">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search shared courses..."
                            className="w-full bg-muted/50 border border-border rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground transition-colors shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="glass-card rounded-3xl p-16 text-center border-dashed border-border hover:border-primary/50 transition-colors mt-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Globe className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-3">No courses found</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {courses.length === 0 ? "Be the first to create and share a course!" : "No courses match your search criteria."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="group relative">
                            <CourseCard
                                course={course}
                                disableDelete={true}
                                sharedLinkOverride={`/shared/${course.id}`}
                                isExploreView={true}
                                currentUserId={user?.uid}
                                onLikeToggle={handleLikeToggle}
                                isLiked={likedCourseIds.has(course.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
