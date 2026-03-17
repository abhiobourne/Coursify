"use client";

import { useEffect, useState } from "react";
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameMonth } from "date-fns";
import { getUserActivity, DailyActivity } from "@/lib/courses";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export function ActivityHeatmap() {
    const { user } = useAuth();
    const [activity, setActivity] = useState<DailyActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const creationYear = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).getFullYear()
        : new Date().getFullYear();

    useEffect(() => {
        async function loadActivity() {
            if (!user) return;
            try {
                const data = await getUserActivity(user.uid);
                setActivity(data);
            } catch (error) {
                console.error("Failed to load activity", error);
            } finally {
                setLoading(false);
            }
        }
        loadActivity();
    }, [user, selectedYear]);

    if (loading) {
        return (
            <div className="flex justify-center py-20 w-full min-h-[200px] items-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const startDate = startOfYear(new Date(selectedYear, 0, 1));
    const endDate = endOfYear(new Date(selectedYear, 11, 31));
    const daysInYear = eachDayOfInterval({ start: startDate, end: endDate });

    // Map activity data by date string for O(1) lookups
    const activityMap = new Map<string, number>();
    activity.forEach(a => {
        // activity dateStr is YYYY-MM-DD
        activityMap.set(a.dateStr, a.secondsStudied);
    });

    // Group days into weeks (columns)
    // A week is an array of 7 elements (Date or null)
    // In JS, getDay() returns 0 for Sunday, 6 for Saturday
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = Array(startDate.getDay()).fill(null);

    daysInYear.forEach(day => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    // LeetCode Color Scale logic
    const getColorClass = (seconds: number) => {
        if (seconds === 0) return "bg-zinc-200 dark:bg-zinc-800/50";
        if (seconds < 60 * 15) return "bg-[#9be9a8] dark:bg-[#0e4429]"; // < 15 mins (Level 1)
        if (seconds < 60 * 30) return "bg-[#40c463] dark:bg-[#006d32]"; // < 30 mins (Level 2)
        if (seconds < 60 * 60) return "bg-[#30a14e] dark:bg-[#26a641]"; // < 60 mins (Level 3)
        return "bg-[#216e39] dark:bg-[#39d353]"; // > 60 mins (Level 4)
    };

    const activeDays = Array.from(activityMap.values()).filter(sec => sec > 0).length;

    return (
        <div className="flex flex-col w-full overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 px-2">
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{activeDays} submissions in {selectedYear}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Total active days tracked</p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setSelectedYear(prev => prev - 1)}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        disabled={selectedYear <= creationYear}
                        title="Previous Year"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold min-w-[4ch] text-center">{selectedYear}</span>
                    <button
                        onClick={() => setSelectedYear(prev => prev + 1)}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        disabled={selectedYear >= new Date().getFullYear()}
                        title="Next Year"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Heatmap Container */}
            <div className="flex flex-col w-full max-w-full overflow-hidden">
                <div className="flex gap-[1px] sm:gap-[2px] md:gap-[3px] mt-6 justify-between w-full">

                    {/* Week Columns */}
                    {weeks.map((week, weekIndex) => {
                        // Find if this week is the boundary to a new month to add spacing
                        const firstValidDay = week.find(d => d !== null);
                        const thisMonth = firstValidDay ? firstValidDay.getMonth() : -1;

                        let isNewMonth = false;
                        let shouldAddMonthGap = false;

                        if (weekIndex === 0 && firstValidDay) {
                            isNewMonth = true;
                        } else if (weekIndex > 0) {
                            const prevWeekFirstDay = weeks[weekIndex - 1].find(d => d !== null);
                            if (prevWeekFirstDay && thisMonth !== prevWeekFirstDay.getMonth()) {
                                isNewMonth = true;
                            }
                        }

                        if (weekIndex < weeks.length - 1) {
                            // Find next week's first valid day
                            const nextWeekFirstDay = weeks[weekIndex + 1].find(d => d !== null);
                            // If next week's first day is a different month, Add Gap!
                            if (nextWeekFirstDay && nextWeekFirstDay.getMonth() !== thisMonth) {
                                shouldAddMonthGap = true;
                            }
                        }

                        return (
                            <div key={weekIndex} className={`relative flex flex-col flex-1 max-w-[10px] gap-[1px] sm:gap-[2px] md:gap-[3px] ${shouldAddMonthGap ? 'mr-[2px] sm:mr-[3px] md:mr-1.5' : ''}`}>
                                {isNewMonth && firstValidDay && (
                                    <div className="absolute -top-6 left-0 text-[9px] md:text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:block">
                                        {format(firstValidDay, "MMM")}
                                    </div>
                                )}
                                {week.map((day, dayIndex) => {
                                    if (!day) {
                                        return <div key={dayIndex} className="w-full aspect-square transparent" />;
                                    }

                                    const dateStr = format(day, "yyyy-MM-dd");
                                    const seconds = activityMap.get(dateStr) || 0;
                                    const minutes = Math.ceil(seconds / 60);
                                    const colorClass = getColorClass(seconds);

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`w-full aspect-square rounded-[1px] md:rounded-[2px] ${colorClass} hover:ring-1 md:hover:ring-2 hover:ring-primary/50 hover:ring-offset-1 hover:ring-offset-background transition-all cursor-pointer relative group`}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 border border-white/10 text-white text-[11px] font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                                                {minutes > 0 ? `${minutes} minutes studied` : 'No study activity'} on {format(day, "MMM d, yyyy")}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Legend */}
            <div className="flex items-center justify-end gap-2 text-xs font-medium text-muted-foreground mt-2 px-2">
                <span>Less</span>
                <div className="flex gap-1.5 items-center">
                    <div className="w-3 h-3 rounded-sm bg-zinc-200 dark:bg-zinc-800/50" />
                    <div className="w-3 h-3 rounded-sm bg-[#9be9a8] dark:bg-[#0e4429]" />
                    <div className="w-3 h-3 rounded-sm bg-[#40c463] dark:bg-[#006d32]" />
                    <div className="w-3 h-3 rounded-sm bg-[#30a14e] dark:bg-[#26a641]" />
                    <div className="w-3 h-3 rounded-sm bg-[#216e39] dark:bg-[#39d353]" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
