"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getUserCourses, deleteCourse, getFavoriteVideos, Course, FavoriteVideo } from "@/lib/courses";
import { CourseCard } from "@/components/ui/CourseCard";
import { FavoriteVideoCard } from "@/components/ui/FavoriteVideoCard";
import { AddCourseDialog } from "@/components/ui/AddCourseDialog";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Plus, Trash2, Library, Star, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
    const [activeTab, setActiveTab] = useState<'courses' | 'favorites'>('courses');
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
                    const [userCourses, userFavs] = await Promise.all([
                        getUserCourses(user.uid),
                        getFavoriteVideos(user.uid)
                    ]);
                    setCourses(userCourses);
                    setFavorites(userFavs);
                } catch (error) {
                    console.error("Error loading courses:", error);
                } finally {
                    setLoading(false);
                }
            }
        }

        loadCourses();
    }, [user, authLoading, router]);

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteCourse(courseId);
            setCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (error) {
            console.error("Error deleting course:", error);
            alert("Failed to delete course");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
                            .map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    onDelete={handleDeleteCourse}
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
                            .map(video => (
                                <FavoriteVideoCard key={video.id} video={video} />
                            ))}
                    </div>
                )
            )}
        </div>
    );
}
