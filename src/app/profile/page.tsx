"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getUserCourses, getUserActivity, DailyActivity, Course } from "@/lib/courses";
import { getUserProfile, UserProfile } from "@/lib/user";
import {
    LayoutDashboard,
    BookOpen,
    Award,
    Settings,
    TrendingUp,
    Clock,
    CheckCircle2,
    ChevronRight,
    PlaySquare,
    Medal
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActivityHeatmap } from "@/components/ui/ActivityHeatmap";

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalCourses: 0,
        completedCourses: 0,
        totalHours: 0,
        currentStreak: 0,
        bestStreak: 0,
        isPro: false,
    });
    const [recentCourses, setRecentCourses] = useState<any[]>([]);
    const [activities, setActivities] = useState<DailyActivity[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            // Load custom profile details
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);

            const courses = await getUserCourses(user.uid);
            const userActivities = await getUserActivity(user.uid);
            setActivities(userActivities);

            // Compute Stats
            const completed = courses.filter((c: Course) => c.completedDuration && c.totalDuration && c.completedDuration >= c.totalDuration - 10).length;
            const totalSeconds = userActivities.reduce((acc: number, curr: DailyActivity) => acc + curr.secondsStudied, 0);
            const totalHours = Math.round(totalSeconds / 3600);

            // Sort courses by last accessed or creation date for "Recent"
            const sortedCourses = [...courses].sort((a: Course, b: Course) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis()).slice(0, 3);
            setRecentCourses(sortedCourses);

            // Calculate Streak
            const activeDays = new Set(userActivities.map((a: DailyActivity) => a.dateStr));

            const ytCourseCount = courses.filter(c => c.sourceUrl !== 'custom').length;
            const customCourseCount = courses.filter(c => c.sourceUrl === 'custom').length;
            const isPro = ytCourseCount > 4 || customCourseCount > 1;

            setStats({
                totalCourses: courses.length,
                completedCourses: completed,
                totalHours: totalHours,
                currentStreak: activeDays.size > 0 ? 1 : 0, // Placeholder
                bestStreak: activeDays.size, // Placeholder
                isPro,
            });
        };

        loadData();
    }, [user]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background text-foreground flex justify-center py-24 px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">

                {/* Sidebar */}
                <aside className="w-full md:w-[300px] rounded-[36px] bg-white dark:bg-white/5 border border-border dark:border-white/10 p-8 flex flex-col gap-8 flex-shrink-0 shadow-xl dark:shadow-2xl">
                    <div className="flex flex-col items-center text-center gap-4 mt-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserAvatarPlaceholder />
                                )}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">{user.displayName || "Learner"}</h1>
                            <p className="text-sm text-primary font-medium mt-1 uppercase tracking-widest text-[10px]">
                                {stats.isPro ? "Pro Member" : "Free Tier"}
                            </p>
                            {userProfile?.bio && (
                                <p className="text-xs text-muted-foreground mt-3 italic max-w-[200px]">"{userProfile.bio}"</p>
                            )}
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2 mt-4 flex-grow">
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all text-sm font-medium">
                            <LayoutDashboard className="w-4 h-4 opacity-80" /> Dashboard
                        </Link>
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-foreground transition-all text-sm font-medium">
                            <UserAvatarPlaceholder className="w-4 h-4 opacity-80" /> Overview
                        </Link>
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all text-sm font-medium">
                            <BookOpen className="w-4 h-4 opacity-80" /> My Courses
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all text-sm font-medium">
                            <Settings className="w-4 h-4 opacity-80" /> Settings
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-grow flex flex-col gap-6 w-full">

                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-2 mb-2 gap-4">
                        <h2 className="text-3xl font-bold tracking-tight">Learning Profile</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all"
                            >
                                Resume Learning
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Stat Widget 1 */}
                        <div className="rounded-[36px] bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6 md:p-8 flex flex-col justify-between shadow-lg group hover:border-orange-500/30 transition-all">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 block">Current Streak</span>
                            <div>
                                <div className="text-4xl font-black flex items-baseline gap-1" style={{ letterSpacing: "-0.04em" }}>
                                    {stats.currentStreak} <span className="text-sm font-medium text-muted-foreground tracking-normal">Days</span>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1 group-hover:text-orange-400 transition-colors">
                                    <TrendingUp className="w-3 h-3" /> Personal best is {stats.bestStreak}
                                </div>
                            </div>
                        </div>

                        {/* Stat Widget 2 */}
                        <div className="rounded-[36px] bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6 md:p-8 flex flex-col justify-between shadow-lg group hover:border-blue-500/30 transition-all">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 block">Total Learned</span>
                            <div>
                                <div className="text-4xl font-black flex items-baseline gap-1" style={{ letterSpacing: "-0.04em" }}>
                                    {stats.totalHours} <span className="text-sm font-medium text-muted-foreground tracking-normal">Hours</span>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                                    <Clock className="w-3 h-3" /> Across {stats.totalCourses} courses
                                </div>
                            </div>
                        </div>

                        {/* Stat Widget 3 */}
                        <div className="rounded-[36px] bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6 md:p-8 flex flex-col justify-between shadow-lg group hover:border-green-500/30 transition-all">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 block">Completed</span>
                            <div>
                                <div className="text-4xl font-black flex items-baseline gap-1" style={{ letterSpacing: "-0.04em" }}>
                                    {stats.completedCourses} <span className="text-sm font-medium text-muted-foreground tracking-normal">Courses</span>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1 group-hover:text-green-400 transition-colors">
                                    <CheckCircle2 className="w-3 h-3" /> {stats.totalCourses - stats.completedCourses} in progress
                                </div>
                            </div>
                        </div>

                        {/* Heatmap Widget */}
                        <div className="md:col-span-3 rounded-[36px] bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6 md:p-8 flex flex-col shadow-lg">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Activity Log</span>
                            </div>

                            <div className="w-full flex justify-center py-6 bg-secondary/20 dark:bg-black/30 rounded-2xl border border-border dark:border-white/5">
                                <div className="w-full max-w-full px-2 sm:px-4">
                                    <ActivityHeatmap />
                                </div>
                            </div>
                        </div>

                        {/* Recent Courses Widget */}
                        <div className="md:col-span-3 rounded-[36px] bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6 md:p-8 flex flex-col shadow-lg">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-6">Recent Activity</span>

                            {recentCourses.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                                    No courses started yet.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {recentCourses.map(course => (
                                        <div key={course.id} onClick={() => router.push(`/dashboard`)} className="flex items-center p-4 rounded-2xl bg-secondary/10 hover:bg-secondary/30 border border-transparent hover:border-border dark:hover:border-white/10 transition-all cursor-pointer group">
                                            <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform flex-shrink-0 relative overflow-hidden">
                                                {course.thumbnailUrl ? (
                                                    <img src={course.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                                ) : (
                                                    <PlaySquare className="w-5 h-5 text-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0 mr-4">
                                                <div className="text-sm font-bold text-foreground truncate mb-1">{course.title}</div>
                                                <div className="text-xs text-muted-foreground truncate">{course.instructorName || "Custom Source"}</div>
                                            </div>
                                            <div className="w-32 flex items-center gap-3 flex-shrink-0">
                                                <div className="h-1.5 flex-grow bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.round((course.completedDuration / Math.max(course.totalDuration, 1)) * 100) || 0)}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground w-8 text-right">{Math.min(100, Math.round((course.completedDuration / Math.max(course.totalDuration, 1)) * 100) || 0)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

// Simple fallback icon component
function UserAvatarPlaceholder({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className || "w-10 h-10 fill-current opacity-80"}>
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
        </svg>
    )
}
