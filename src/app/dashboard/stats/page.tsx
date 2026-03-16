"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getUserActivity, DailyActivity, getUserCourses, Course } from "@/lib/courses";
import { Loader2, TrendingUp, Clock, Calendar, CheckCircle, ChevronLeft } from "lucide-react";
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
        <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500 max-w-5xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Learning Analytics</h1>
                    <p className="text-muted-foreground">Track your progress and build learning habits.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                {/* Streak Card */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                            <h3 className="text-2xl font-bold text-foreground flex items-baseline gap-1">
                                {currentStreak} <span className="text-base font-medium text-muted-foreground">days</span>
                                {currentStreak > 0 && <span className="ml-2 text-xl">🔥</span>}
                            </h3>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Best Streak:</span>
                        <span className="font-semibold text-foreground">{maxStreak} days</span>
                    </div>
                </div>

                {/* Total Hours Card */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Time Listened</p>
                            <h3 className="text-2xl font-bold text-foreground flex items-baseline gap-1">
                                {totalHours} <span className="text-base font-medium text-muted-foreground">hrs</span>
                            </h3>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Lessons:</span>
                        <span className="font-semibold text-foreground">{totalCoursesCount}</span>
                    </div>
                </div>

                {/* Completed Courses Card */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Completed</p>
                            <h3 className="text-2xl font-bold text-foreground flex items-baseline gap-1">
                                {completedCoursesCount} <span className="text-base font-medium text-muted-foreground">courses</span>
                            </h3>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Active Days:</span>
                        <span className="font-semibold text-foreground">{activeDays.length}</span>
                    </div>
                </div>

            </div>

            {/* Activity Chart Area */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Activity History
                    </h2>
                </div>

                {activities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No activity recorded yet. Start watching a course to build your history!</p>
                    </div>
                ) : (
                    <div className="h-64 flex items-end gap-2 overflow-x-auto pb-4 pt-8">
                        {/* Simple Bar Chart */}
                        {(() => {
                            // Get last 14 days
                            const d = new Date();
                            const pastDays = [];
                            for (let i = 13; i >= 0; i--) {
                                const past = new Date(d);
                                past.setDate(d.getDate() - i);
                                pastDays.push(past.toISOString().split('T')[0]);
                            }

                            // Find max activity
                            const maxSecs = Math.max(...activities.map(a => a.secondsStudied), 1); // min 1 to avoid div by 0

                            return pastDays.map(dateStr => {
                                const act = activities.find(a => a.dateStr === dateStr);
                                const secs = act ? act.secondsStudied : 0;
                                const hrs = secs / 3600;
                                const mins = secs / 60;
                                const heightPct = Math.max((secs / maxSecs) * 100, 2); // 2% minimum height for visibility
                                const isToday = dateStr === d.toISOString().split('T')[0];
                                const label = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });

                                return (
                                    <div key={dateStr} className="flex-1 min-w-[30px] flex flex-col items-center gap-2 group relative">
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-10 pointer-events-none">
                                            {hrs > 1 ? `${Math.round(hrs * 10) / 10} hrs` : `${Math.round(mins)} mins`}
                                        </div>

                                        <div className="w-full flex-1 flex items-end bg-white/5 rounded-t-sm overflow-hidden">
                                            <div
                                                className={`w-full rounded-t-sm transition-all duration-1000 ${secs > 0 ? (isToday ? 'bg-primary' : 'bg-primary/60') : 'bg-transparent'}`}
                                                style={{ height: `${heightPct}%` }}
                                            />
                                        </div>
                                        <span className={`text-[10px] uppercase font-medium ${isToday ? 'text-primary' : 'text-zinc-500'}`}>
                                            {label.charAt(0)}
                                        </span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>

        </div>
    );
}
