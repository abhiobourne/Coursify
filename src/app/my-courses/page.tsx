"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getUserCourses, Course } from "@/lib/courses";
import { CourseCard } from "@/components/ui/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search as SearchIcon, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyCourses() {
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        async function loadCourses() {
            if (user) {
                try {
                    const userCourses = await getUserCourses(user.uid);
                    setCourses(userCourses);
                } catch (error) {
                    console.error("Error loading courses:", error);
                } finally {
                    setLoading(false);
                }
            }
        }

        loadCourses();
    }, [user, authLoading, router]);


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
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
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

    if (!user) return null;

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-muted/50 hover:bg-muted rounded-xl transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-6 h-6 text-foreground" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">My Courses</h1>
                        <p className="text-muted-foreground">View all your enrolled courses.</p>
                    </div>
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
                </div>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center border-dashed border-border hover:border-primary/50 transition-colors mt-8">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">No courses found</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        {courses.length === 0 ? "You haven't imported any courses yet." : "No courses match your search."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                    {filteredCourses.map(course => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            disableDelete={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
