"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getUserActivity, DailyActivity, getUserCourses, Course } from "@/lib/courses";
import { Loader2, TrendingUp, Clock, Calendar, CheckCircle, ChevronLeft } from "lucide-react";
import { ActivityHeatmap } from "@/components/ui/ActivityHeatmap";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StatsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activities, setActivities] = useState<DailyActivity[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        async function loadData() {
            if (user) {
                try {
                    const [userActivity, userCourses] = await Promise.all([
                        getUserActivity(user.uid),
                        getUserCourses(user.uid)
                    ]);
                    setActivities(userActivity);
                    setCourses(userCourses);
                } catch (error) {
                    console.error("Error loading stats:", error);
                } finally {
                    setLoading(false);
                }
            }
        }

        loadData();
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    // Calculate Stats
    const totalSeconds = activities.reduce((acc, act) => acc + act.secondsStudied, 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    const completedCoursesCount = courses.filter(c => c.completedDuration >= c.totalDuration && c.totalDuration > 0).length;
    const totalCoursesCount = courses.length;

    // Calculate Streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort activities chronological
    const sortedActs = [...activities].sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // Process unique days with activity > 0
    const activeDaysStr = new Set<string>();
    sortedActs.forEach(a => {
        if (a.secondsStudied > 0) activeDaysStr.add(a.dateStr);
    });

    const activeDays = Array.from(activeDaysStr).sort();

    if (activeDays.length > 0) {
        let prevDate = new Date(activeDays[0]);
        tempStreak = 1;

        for (let i = 1; i < activeDays.length; i++) {
            const currDate = new Date(activeDays[i]);
            const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 1;
            }
            prevDate = currDate;
        }
        maxStreak = Math.max(maxStreak, tempStreak);

        // Calculate current streak
        const lastActiveDate = new Date(activeDays[activeDays.length - 1]);
        const diffToToday = Math.ceil(Math.abs(today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffToToday <= 1) {
            currentStreak = tempStreak;
        } else {
            currentStreak = 0; // Streak broken
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in duration-700 max-w-6xl pt-24">
            {/* Header Section */}
            <div className="mb-16 relative">
                <div className="absolute inset-0 max-w-lg mx-auto bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
                        <TrendingUp className="w-4 h-4" />
                        Analytics Dashboard
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent tracking-tight">
                        Learning Insights.
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium">
                        Quantify your knowledge growth, track consistency, and measure your mastery over time.
                    </p>
                </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 px-2">
                {/* Streak Card */}
                <div className="relative group overflow-hidden rounded-3xl bg-black/40 border border-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-orange-500/50 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <TrendingUp className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-widest">
                                Best: {maxStreak}
                            </div>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Streak</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter">{currentStreak}</span>
                            <span className="text-lg font-bold text-white/50 uppercase">Days</span>
                            {currentStreak > 0 && <span className="text-2xl animate-bounce ml-2">🔥</span>}
                        </div>
                    </div>
                </div>

                {/* Hours Card */}
                <div className="relative group overflow-hidden rounded-3xl bg-black/40 border border-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Clock className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-widest">
                                {totalCoursesCount} Courses
                            </div>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Study Volume</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter">{totalHours}</span>
                            <span className="text-lg font-bold text-white/50 uppercase">Hours</span>
                        </div>
                    </div>
                </div>

                {/* Completion Card */}
                <div className="relative group overflow-hidden rounded-3xl bg-black/40 border border-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-green-500/50 hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                                {activeDays.length} Active
                            </div>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Mastery Index</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter">{completedCoursesCount}</span>
                            <span className="text-lg font-bold text-white/50 uppercase">Finished</span>
                        </div>
                    </div>
                </div>

                {/* Consistency Card */}
                <div className="relative group overflow-hidden rounded-3xl bg-black/40 border border-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-purple-500/50 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Calendar className="w-6 h-6 text-purple-500" />
                            </div>
                            <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] font-bold uppercase tracking-widest gap-1 flex items-center">
                                Tenure: {Math.ceil(Math.abs(Date.now() - new Date(user.metadata.creationTime || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}d
                            </div>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Consistency Pulse</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter">
                                {Math.round((activeDays.length / Math.max(1, (new Date().getTime() - new Date(user.metadata.creationTime || Date.now()).getTime()) / (1000 * 60 * 60 * 24))) * 100)}
                            </span>
                            <span className="text-lg font-bold text-white/50 uppercase">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap Area */}
            <div className="relative group overflow-hidden rounded-3xl bg-black/40 border border-white/10 p-10 shadow-2xl backdrop-blur-xl mb-16">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                                <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"></div>
                                Activity Heatmap
                            </h2>
                            <p className="text-muted-foreground font-medium pl-5 max-w-md">Visualize your daily study efforts and track your learning persistence over the year.</p>
                        </div>
                    </div>

                    {activities.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center gap-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary/80 mb-2">
                                <Calendar className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight">No Activity Yet</h3>
                            <p className="text-muted-foreground font-medium max-w-sm">Start watching courses to begin building your activity heatmap.</p>
                            <Link href="/dashboard" className="mt-4 px-8 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                Browse Courses
                            </Link>
                        </div>
                    ) : (
                        <div className="pt-4 overflow-x-auto pb-4 custom-scrollbar bg-black/50 rounded-2xl border border-white/5 p-8">
                            <div className="min-w-[800px]">
                                <ActivityHeatmap />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { ChevronRight } from "lucide-react";
